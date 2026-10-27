using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class RemuneracaoMotoristaTests
{
    private static async Task<CriarViagemDto> Dados(ApiFactory factory, decimal? frete)
    {
        await using var scope = factory.Services.CreateAsyncScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var motorista = new Motorista { Nome = "Motorista teste", Ativo = true };
        var caminhao = new Caminhao { Placa = "TESTE01", Modelo = "Teste", Ativo = true };
        db.AddRange(motorista, caminhao); await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new() { Origem = "Origem teste", Destino = "Destino teste", MotoristaId = motorista.Id, CaminhaoId = caminhao.Id, DataViagem = new(2030, 1, 2), ValorFrete = frete };
    }

    private static AtualizarViagemDto Atualizar(CriarViagemDto dto) => new() { Origem = dto.Origem, Destino = dto.Destino,
        MotoristaId = dto.MotoristaId, CaminhaoId = dto.CaminhaoId, DataViagem = dto.DataViagem, ValorFrete = dto.ValorFrete, Status = "Planejada" };

    [Theory]
    [InlineData("2000", "300")]
    [InlineData("1500.50", "225.08")]
    [InlineData("0.10", "0.02")]
    [InlineData("0.03", "0")]
    [InlineData("0", "0")]
    [InlineData(null, "0")]
    [InlineData("9999999999.99", "1500000000.00")]
    public async Task CadastroCalculaPorViagemComArredondamentoESemZerosNovos(string? frete, string previsto)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var dados = await Dados(factory, frete is null ? null : decimal.Parse(frete, CultureInfo.InvariantCulture));
        var created = await client.PostAsJsonAsync("/api/Viagens", dados, token); Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var viagem = (await created.Content.ReadFromJsonAsync<Viagem>(token))!; Assert.True(viagem.GerarRemuneracaoAutomatica);
        var despesas = (await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!;
        var esperado = decimal.Parse(previsto, CultureInfo.InvariantCulture);
        if (esperado == 0) Assert.Empty(despesas);
        else
        {
            var despesa = Assert.Single(despesas); Assert.Equal(esperado, despesa.Valor); Assert.Equal(viagem.Id, despesa.ViagemId);
            Assert.Equal("RemuneracaoMotorista", despesa.Origem); Assert.True(despesa.ConsiderarNoFinanceiro); Assert.Equal(dados.DataViagem, despesa.DataDespesa);
        }
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(esperado, resumo.TotalRemuneracaoMotoristas); Assert.Equal(esperado, resumo.TotalDespesas);
        Assert.Equal((dados.ValorFrete ?? 0) - esperado, resumo.Lucro);
    }

    [Fact]
    public async Task PausarERetomarPreservaRemuneracaoEDemaisDados()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var dados = await Dados(factory, 2000m);
        var created = await client.PostAsJsonAsync("/api/Viagens", dados, token); created.EnsureSuccessStatusCode();
        var despesa = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
        foreach (var status in new[] { "Em andamento", "Pausada", "Em andamento", "Concluída" })
        {
            var update = Atualizar(dados); update.Status = status;
            Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(created.Headers.Location, update, token)).StatusCode);
            var viagem = (await client.GetFromJsonAsync<Viagem>(created.Headers.Location, token))!;
            Assert.Equal(status, viagem.Status); Assert.Equal(dados.ValorFrete, viagem.ValorFrete);
            Assert.Equal(dados.MotoristaId, viagem.MotoristaId); Assert.Equal(dados.CaminhaoId, viagem.CaminhaoId);
            var atual = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
            Assert.Equal(despesa.Id, atual.Id); Assert.Equal(300m, atual.Valor); Assert.True(atual.ConsiderarNoFinanceiro);
        }
    }

    [Fact]
    public async Task EdicaoSincronizaMesmoLancamentoPreservaExclusaoEZeroHistorico()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dados = await Dados(factory, 100m);
        var created = await client.PostAsJsonAsync("/api/Viagens", dados, token); created.EnsureSuccessStatusCode();
        var despesa = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
        (await client.PatchAsJsonAsync($"/api/Despesas/{despesa.Id}/situacao-financeira", new { considerarNoFinanceiro = false }, token)).EnsureSuccessStatusCode();
        foreach (var frete in new decimal?[] { 200m, 0m, null, 300m })
        {
            dados.ValorFrete = frete; dados.DataViagem = new(2030, 2, 3);
            (await client.PutAsJsonAsync(created.Headers.Location, Atualizar(dados), token)).EnsureSuccessStatusCode();
            var atual = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
            Assert.Equal(despesa.Id, atual.Id); Assert.Equal(despesa.DataCadastro, atual.DataCadastro); Assert.Equal((frete ?? 0) * .15m, atual.Valor);
            Assert.Equal(dados.DataViagem, atual.DataDespesa); Assert.False(atual.ConsiderarNoFinanceiro);
        }
    }

    [Fact]
    public async Task LegadoNaoGeraRetroativoEFlagNaoPodeSerForjadaNoCadastro()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dados = await Dados(factory, 100m);
        Guid id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); var antiga = new Viagem { Origem = dados.Origem, Destino = dados.Destino,
                MotoristaId = dados.MotoristaId, CaminhaoId = dados.CaminhaoId, DataViagem = dados.DataViagem, ValorFrete = 100m, Status = "Planejada" };
            db.Viagens.Add(antiga); await db.SaveChangesAsync(token); id = antiga.Id;
        }
        var update = Atualizar(dados); update.ValorFrete = 200m;
        (await client.PutAsJsonAsync($"/api/Viagens/{id}", update, token)).EnsureSuccessStatusCode();
        Assert.Empty((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
        var created = await client.PostAsJsonAsync("/api/Viagens", new { dados.Origem, dados.Destino, dados.MotoristaId, dados.CaminhaoId, dados.DataViagem, dados.ValorFrete, gerarRemuneracaoAutomatica = false }, token);
        created.EnsureSuccessStatusCode(); Assert.True((await created.Content.ReadFromJsonAsync<Viagem>(token))!.GerarRemuneracaoAutomatica);
        Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
    }

    [Fact]
    public async Task AutomaticaSomenteAceitaPatchFinanceiroComProtecaoPorVersao()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var created = await client.PostAsJsonAsync("/api/Viagens", await Dados(factory, 100m), token); created.EnsureSuccessStatusCode();
        var despesa = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!); var path = $"/api/Despesas/{despesa.Id}";
        var leitura = await client.GetAsync(path, token);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(path, new AtualizarDespesaDto { Descricao = "Manual", Categoria = "Manual", Valor = 1m, DataDespesa = new(2030, 1, 2) }, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.DeleteAsync(path, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PatchAsJsonAsync($"{path}/situacao-financeira", new { }, token)).StatusCode);
        using var patch = new HttpRequestMessage(HttpMethod.Patch, $"{path}/situacao-financeira") { Content = JsonContent.Create(new { considerarNoFinanceiro = false, valor = 999 }) };
        patch.Headers.IfMatch.Add(leitura.Headers.ETag!);
        Assert.Equal(HttpStatusCode.NoContent, (await client.SendAsync(patch, token)).StatusCode);
        using var antigo = new HttpRequestMessage(HttpMethod.Patch, $"{path}/situacao-financeira") { Content = JsonContent.Create(new { considerarNoFinanceiro = true }) };
        antigo.Headers.IfMatch.Add(leitura.Headers.ETag!);
        Assert.Equal(HttpStatusCode.Conflict, (await client.SendAsync(antigo, token)).StatusCode);
        var atual = (await client.GetFromJsonAsync<Despesa>(path, token))!; Assert.Equal(15m, atual.Valor); Assert.False(atual.ConsiderarNoFinanceiro);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task CancelamentoRespeitaEscolhaEPeriodoSemDuplaContagem(bool manter)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var created = await client.PostAsJsonAsync("/api/Viagens", await Dados(factory, 2000m), token); created.EnsureSuccessStatusCode();
        var viagem = (await created.Content.ReadFromJsonAsync<Viagem>(token))!; var path = $"/api/Viagens/{viagem.Id}/cancelamento";
        var previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>(path, token))!;
        Assert.Equal(300m, previa.TotalDespesas); Assert.Equal(1, previa.QuantidadeDespesas);
        (await client.PostAsJsonAsync(path, new CancelamentoViagemDto { ManterDespesas = manter, VersaoDespesas = previa.VersaoDespesas }, token)).EnsureSuccessStatusCode();
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro?dataInicial=2030-01-02&dataFinal=2030-01-02", token))!;
        Assert.Equal(manter ? 300m : 0m, resumo.TotalRemuneracaoMotoristas); Assert.Equal(resumo.TotalRemuneracaoMotoristas, resumo.TotalDespesas);
        Assert.Equal(-resumo.TotalDespesas, resumo.Lucro);
        var fora = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro?dataInicial=2030-01-03", token))!;
        Assert.Equal(0m, fora.TotalRemuneracaoMotoristas);
    }

    [Fact]
    public async Task FalhaNaDespesaDesfazCadastroDaViagem()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dados = await Dados(factory, 100m);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.ExecuteSqlRawAsync("CREATE TRIGGER impedir_remuneracao BEFORE INSERT ON despesas WHEN NEW.origem = 'RemuneracaoMotorista' BEGIN SELECT RAISE(ABORT, 'falha de teste isolado'); END;", token);
        }
        Assert.Equal(HttpStatusCode.InternalServerError, (await client.PostAsJsonAsync("/api/Viagens", dados, token)).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<Viagem[]>("/api/Viagens", token))!); Assert.Empty((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
    }

    [Fact]
    public void MigrationCorrespondeAoModeloSemExecutarSql()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=unused.invalid;Database=unused").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        var sql = db.GetService<IMigrator>().GenerateScript("20261027010000_AdicionarSituacaoFinanceiraDespesa", "20261027020000_AdicionarRemuneracaoMotorista");
        Assert.Contains("DEFAULT 'Manual'", sql); Assert.Contains("DEFAULT FALSE", sql); Assert.Contains("CREATE UNIQUE INDEX", sql);
        Assert.DoesNotContain("UPDATE viagens", sql); Assert.DoesNotContain("DELETE FROM", sql);
    }
}
