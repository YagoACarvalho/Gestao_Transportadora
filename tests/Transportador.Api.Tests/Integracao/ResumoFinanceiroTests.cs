using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class ResumoFinanceiroTests
{
    [Fact]
    public async Task SemRegistros_RetornaZerosNosTotaisNovosELegados()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(0m, resumo.TotalDespesasViagens); Assert.Equal(0m, resumo.TotalDespesasGerais);
        Assert.Equal(0m, resumo.TotalDespesas); Assert.Equal(0m, resumo.TotalFretes); Assert.Equal(0m, resumo.Lucro);
    }

    [Theory]
    [InlineData("", 100, 30, 35)]
    [InlineData("?dataInicial=2030-01-02&dataFinal=2030-01-02", 100, 10, 5)]
    [InlineData("?dataInicial=2030-01-03", 0, 20, 0)]
    [InlineData("?dataFinal=2030-01-01", 0, 0, 0)]
    public async Task SeparaCustosRespeitandoPeriodoLegadosECancelamento(string query, int fretes, int viagens, int gerais)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cancelada = new Viagem { Status = "Cancelada", ValorFrete = 900m, DataViagem = new(2030, 1, 2) };
            db.Viagens.AddRange(cancelada, new() { Status = null, ValorFrete = 100m, DataViagem = new(2030, 1, 2) });
            db.Despesas.AddRange(
                new() { Viagem = cancelada, Valor = 10m, DataDespesa = new(2030, 1, 2) },
                new() { Viagem = cancelada, Valor = 20m, DataDespesa = new(2030, 1, 3) },
                new() { Valor = 5m, DataDespesa = new(2030, 1, 2) },
                new() { Valor = 30m, DataDespesa = null },
                new() { Valor = null, DataDespesa = null });
            await db.SaveChangesAsync(token);
        }
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>($"/api/Relatorios/resumo-financeiro{query}", token))!;
        Assert.Equal((decimal)fretes, resumo.TotalFretes);
        Assert.Equal((decimal)viagens, resumo.TotalDespesasViagens); Assert.Equal((decimal)gerais, resumo.TotalDespesasGerais);
        Assert.Equal(viagens + gerais, resumo.TotalDespesas); Assert.Equal(fretes - viagens - gerais, resumo.Lucro);
    }

    [Fact]
    public async Task TrocarVinculoReclassificaCustoSemDuplicarTotal()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid viagemId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var viagem = new Viagem { Status = "Concluída" }; db.Viagens.Add(viagem);
            await db.SaveChangesAsync(token); viagemId = viagem.Id;
        }
        var body = new AtualizarDespesaDto { Descricao = "Teste isolado", Categoria = "Teste", Valor = 12.50m, DataDespesa = new(2030, 1, 2) };
        var created = await client.PostAsJsonAsync("/api/Despesas", body, token); created.EnsureSuccessStatusCode();
        foreach (var vinculo in new Guid?[] { viagemId, null })
        {
            body.ViagemId = vinculo;
            (await client.PutAsJsonAsync(created.Headers.Location, body, token)).EnsureSuccessStatusCode();
            var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
            Assert.Equal(12.50m, resumo.TotalDespesas);
            Assert.Equal(vinculo.HasValue ? 12.50m : 0m, resumo.TotalDespesasViagens);
            Assert.Equal(vinculo.HasValue ? 0m : 12.50m, resumo.TotalDespesasGerais);
        }
    }
}
