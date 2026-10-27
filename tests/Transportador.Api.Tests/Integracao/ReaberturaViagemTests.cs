using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class ReaberturaViagemTests
{
    private static AtualizarViagemDto Dados(Viagem viagem) => new() { Origem = viagem.Origem, Destino = viagem.Destino,
        DataViagem = viagem.DataViagem, MotoristaId = viagem.MotoristaId, CaminhaoId = viagem.CaminhaoId,
        ValorFrete = viagem.ValorFrete, Status = "Planejada" };

    [Theory]
    [InlineData("Concluída", true)]
    [InlineData("Cancelada", true)]
    [InlineData("Concluída", false)]
    [InlineData("Cancelada", false)]
    public async Task ReabrePreservandoDadosVinculosInativosEDespesas(string status, bool automatica)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Viagem viagem;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            viagem = new() { Origem = "Teste", Destino = "Teste", Status = status, ValorFrete = 1000m,
                DataViagem = new(2030, 1, 2), GerarRemuneracaoAutomatica = automatica,
                Motorista = new() { Nome = "Teste", Ativo = false }, Caminhao = new() { Placa = "TESTE", Modelo = "Teste", Ativo = false } };
            db.Viagens.Add(viagem);
            db.Despesas.Add(new() { Viagem = viagem, Descricao = "Manual teste", Categoria = "Teste", Valor = 20m, ConsiderarNoFinanceiro = true });
            if (automatica) db.Despesas.Add(new() { Viagem = viagem, Origem = "RemuneracaoMotorista", Valor = 150m, ConsiderarNoFinanceiro = false });
            await db.SaveChangesAsync(token);
        }
        var path = $"/api/Viagens/{viagem.Id}";
        var antes = (await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(path, Dados(viagem), token)).StatusCode);
        var depois = (await client.GetFromJsonAsync<Viagem>(path, token))!;
        Assert.Equal("Planejada", depois.Status); Assert.Equal(viagem.DataCadastro, depois.DataCadastro);
        Assert.Equal(viagem.MotoristaId, depois.MotoristaId); Assert.Equal(viagem.CaminhaoId, depois.CaminhaoId);
        Assert.Equal(viagem.ValorFrete, depois.ValorFrete); Assert.Equal(automatica, depois.GerarRemuneracaoAutomatica);
        var despesas = (await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!;
        Assert.Equal(antes.Length, despesas.Length);
        foreach (var anterior in antes)
        {
            var atual = Assert.Single(despesas, d => d.Id == anterior.Id);
            Assert.Equal(anterior.Valor, atual.Valor); Assert.Equal(anterior.ConsiderarNoFinanceiro, atual.ConsiderarNoFinanceiro);
            Assert.Equal(anterior.DataCadastro, atual.DataCadastro); Assert.Equal(anterior.DataDespesa, atual.DataDespesa);
        }
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(1000m, resumo.TotalFretes); Assert.Equal(20m, resumo.TotalDespesas); Assert.Equal(980m, resumo.Lucro);
        var alterado = Dados(viagem); alterado.Destino = "Outro";
        // Agora planejada, a edição é permitida; o legado continua sem remuneração retroativa.
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(path, alterado, token)).StatusCode);
        Assert.Equal(antes.Length, (await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!.Length);
    }

    [Fact]
    public async Task RegularizaLegadoExigindoDadosENovosVinculosAtivosSemGerarRemuneracao()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid id; Guid motorista; Guid caminhao;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var legado = new Viagem(); var m = new Motorista { Nome = "Teste", Ativo = true };
            var c = new Caminhao { Placa = "TESTE", Modelo = "Teste", Ativo = false };
            db.AddRange(legado, m, c);
            db.Despesas.Add(new() { Viagem = legado, Descricao = "Histórica", Categoria = "Teste", Valor = 27m, ConsiderarNoFinanceiro = false });
            await db.SaveChangesAsync(token); id = legado.Id; motorista = m.Id; caminhao = c.Id;
        }
        var path = $"/api/Viagens/{id}";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(path, new { status = "Planejada" }, token)).StatusCode);
        var dados = new AtualizarViagemDto { Origem = "Teste", Destino = "Teste", DataViagem = new(2030, 1, 2), MotoristaId = motorista, CaminhaoId = caminhao, ValorFrete = 1000m, Status = "Planejada" };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(path, dados, token)).StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Caminhoes.SingleAsync(token)).Ativo = true; await db.SaveChangesAsync(token);
        }
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(path, dados, token)).StatusCode);
        var atual = (await client.GetFromJsonAsync<Viagem>(path, token))!;
        Assert.Equal("Planejada", atual.Status); Assert.False(atual.GerarRemuneracaoAutomatica);
        var despesa = Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
        Assert.Equal("Manual", despesa.Origem); Assert.Equal(27m, despesa.Valor); Assert.False(despesa.ConsiderarNoFinanceiro);
    }

    [Theory]
    [InlineData("Concluída")]
    [InlineData("Cancelada")]
    public async Task ReabrirNaoPermiteEditarDadosNoMesmoPedido(string status)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Viagem viagem;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            viagem = new() { Origem = "Teste", Destino = "Teste", DataViagem = new(2030, 1, 2), Status = status,
                Motorista = new() { Nome = "Teste", Ativo = true }, Caminhao = new() { Placa = "TESTE", Modelo = "Teste", Ativo = true } };
            db.Viagens.Add(viagem); await db.SaveChangesAsync(token);
        }
        var dados = Dados(viagem); dados.Destino = "Alteração";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/Viagens/{viagem.Id}", dados, token)).StatusCode);
        Assert.Equal(status, (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{viagem.Id}", token))!.Status);
    }
}
