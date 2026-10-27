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

public class CancelamentoFinanceiroTests
{
    private static async Task<Guid> Preparar(ApiFactory factory, string status = "Planejada")
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var viagem = new Viagem { Status = status, Origem = "Teste", Destino = "Teste", DataViagem = new(2030, 1, 2),
            Motorista = new() { Nome = "Teste", Ativo = true }, Caminhao = new() { Modelo = "Teste", Placa = "TESTE01", Ativo = true } };
        db.Viagens.Add(viagem);
        db.Despesas.Add(new() { Viagem = viagem, Descricao = "Teste", Categoria = "Teste", Valor = 25m, DataDespesa = new(2030, 1, 2) });
        await db.SaveChangesAsync(TestContext.Current.CancellationToken); return viagem.Id;
    }

    [Theory]
    [InlineData(true, "Planejada")]
    [InlineData(false, "Planejada")]
    [InlineData(true, "Pausada")]
    [InlineData(false, "Pausada")]
    public async Task ConfirmacaoAtualizaViagemECustosERepeticaoNaoAlteraDespesasNovas(bool manter, string status)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var id = await Preparar(factory, status); var path = $"/api/Viagens/{id}/cancelamento";
        var previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>(path, token))!;
        Assert.Equal(1, previa.QuantidadeDespesas); Assert.Equal(25m, previa.TotalDespesas);
        var body = new CancelamentoViagemDto { VersaoDespesas = previa.VersaoDespesas, ManterDespesas = manter };
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync(path, body, token)).StatusCode);
        Assert.Equal("Cancelada", (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!.Status);
        var despesa = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
        Assert.Equal(manter, despesa.ConsiderarNoFinanceiro);
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(manter ? 25m : 0m, resumo.TotalDespesas);
        var nova = new CriarDespesaDto { ViagemId = id, ConsiderarNoFinanceiro = !manter, Descricao = "Posterior", Categoria = "Teste", Valor = 5m, DataDespesa = new(2030, 1, 2) };
        var created = await client.PostAsJsonAsync("/api/Despesas", nova, token); created.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync(path, body, token)).StatusCode);
        Assert.Equal(!manter, (await client.GetFromJsonAsync<Despesa>(created.Headers.Location, token))!.ConsiderarNoFinanceiro);
    }

    [Fact]
    public async Task EscolhaObrigatoriaERotasLegadasNaoContornamConfirmacao()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var id = await Preparar(factory); var path = $"/api/Viagens/{id}";
        var previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>($"{path}/cancelamento", token))!;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync($"{path}/cancelamento", new { previa.VersaoDespesas }, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.DeleteAsync(path, token)).StatusCode);
        var viagem = (await client.GetFromJsonAsync<Viagem>(path, token))!;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(path, new AtualizarViagemDto { Origem = viagem.Origem, Destino = viagem.Destino,
            DataViagem = viagem.DataViagem, MotoristaId = viagem.MotoristaId, CaminhaoId = viagem.CaminhaoId, Status = "Cancelada" }, token)).StatusCode);
        Assert.Equal("Planejada", (await client.GetFromJsonAsync<Viagem>(path, token))!.Status);
        Assert.True(Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!).ConsiderarNoFinanceiro);
    }

    [Theory]
    [InlineData("valor")]
    [InlineData("nova")]
    [InlineData("exclusao")]
    [InlineData("situacao")]
    public async Task MudancasAposPreviaRetornam409SemCancelar(string mudanca)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var id = await Preparar(factory); var path = $"/api/Viagens/{id}/cancelamento";
        var previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>(path, token))!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); var despesa = await db.Despesas.SingleAsync(token);
            if (mudanca == "valor") despesa.Valor = 99;
            if (mudanca == "nova") db.Despesas.Add(new() { ViagemId = id, Valor = 1 });
            if (mudanca == "exclusao") db.Despesas.Remove(despesa);
            if (mudanca == "situacao") (await db.Viagens.SingleAsync(token)).Status = "Em andamento";
            await db.SaveChangesAsync(token);
        }
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync(path, new CancelamentoViagemDto { VersaoDespesas = previa.VersaoDespesas, ManterDespesas = false }, token)).StatusCode);
        Assert.NotEqual("Cancelada", (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!.Status);
        Assert.All((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!, d => Assert.True(d.ConsiderarNoFinanceiro));
    }

    [Fact]
    public async Task NovaDespesaEmCanceladaExigeEscolhaEEdicaoPreservaOuReinclui()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var id = await Preparar(factory, "Cancelada");
        var body = new AtualizarDespesaDto { ViagemId = id, Descricao = "Teste", Categoria = "Teste", Valor = 5m, DataDespesa = new(2030, 1, 2) };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Despesas", body, token)).StatusCode);
        body.ConsiderarNoFinanceiro = false;
        var created = await client.PostAsJsonAsync("/api/Despesas", body, token); created.EnsureSuccessStatusCode();
        body.ConsiderarNoFinanceiro = null;
        (await client.PutAsJsonAsync(created.Headers.Location, body, token)).EnsureSuccessStatusCode();
        Assert.False((await client.GetFromJsonAsync<Despesa>(created.Headers.Location, token))!.ConsiderarNoFinanceiro);
        body.ConsiderarNoFinanceiro = true;
        (await client.PutAsJsonAsync(created.Headers.Location, body, token)).EnsureSuccessStatusCode();
        Assert.True((await client.GetFromJsonAsync<Despesa>(created.Headers.Location, token))!.ConsiderarNoFinanceiro);
    }

    [Fact]
    public void MigrationESnapshotAlinhadosAoModeloPostgresSemConectar()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=unused.invalid;Database=unused").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        var sql = db.GetService<IMigrator>().GenerateScript("20260928141033_CriarTabelaDespesas", "20261027010000_AdicionarSituacaoFinanceiraDespesa");
        Assert.Contains("considerar_no_financeiro", sql); Assert.Contains("DEFAULT TRUE", sql);
        Assert.DoesNotContain("DROP TABLE", sql);
    }

    [Fact]
    public async Task FalhaDePersistenciaNaoAplicaCancelamentoParcial()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var id = await Preparar(factory); var path = $"/api/Viagens/{id}/cancelamento";
        var previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>(path, token))!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // Somente SQLite efêmero do ApiFactory: força falha durante SaveChanges.
            await db.Database.ExecuteSqlRawAsync("CREATE TRIGGER impedir_cancelamento BEFORE UPDATE OF status ON viagens WHEN NEW.status = 'Cancelada' BEGIN SELECT RAISE(ABORT, 'falha de teste isolado'); END;", token);
        }
        Assert.Equal(HttpStatusCode.InternalServerError, (await client.PostAsJsonAsync(path, new CancelamentoViagemDto { VersaoDespesas = previa.VersaoDespesas, ManterDespesas = false }, token)).StatusCode);
        Assert.Equal("Planejada", (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!.Status);
        Assert.True(Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!).ConsiderarNoFinanceiro);
    }

    [Fact]
    public async Task SemDespesasDispensaEscolhaEConcluidaNaoPodeCancelar()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var id = await Preparar(factory);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); db.Despesas.RemoveRange(await db.Despesas.ToListAsync(token)); await db.SaveChangesAsync(token);
        }
        var path = $"/api/Viagens/{id}/cancelamento";
        var previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>(path, token))!;
        Assert.Equal(0, previa.QuantidadeDespesas);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync(path, new { previa.VersaoDespesas }, token)).StatusCode);
        var concluida = await Preparar(factory, "Concluída"); path = $"/api/Viagens/{concluida}/cancelamento";
        previa = (await client.GetFromJsonAsync<ResumoCancelamentoDto>(path, token))!;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(path, new CancelamentoViagemDto { VersaoDespesas = previa.VersaoDespesas, ManterDespesas = false }, token)).StatusCode);
        Assert.Equal("Concluída", (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{concluida}", token))!.Status);
        var inexistente = $"/api/Viagens/{Guid.NewGuid()}/cancelamento";
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(inexistente, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync(inexistente, new { versaoDespesas = "teste" }, token)).StatusCode);
    }

    [Fact]
    public async Task NovasRotasExigemAutenticacao()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(false); using var client = factory.CriarCliente();
        var path = $"/api/Viagens/{Guid.NewGuid()}/cancelamento";
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path, token)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync(path, new { versaoDespesas = "teste" }, token)).StatusCode);
    }
}
