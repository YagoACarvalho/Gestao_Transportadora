using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class CompatibilidadeMainTests
{
    [Fact]
    public async Task Despesas_MantemCrudConsultaEIdentidade()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var created = await client.PostAsJsonAsync("/api/Despesas", new CriarDespesaDto { Descricao = "Despesa de teste", Categoria = "Teste", Valor = 12.50m, DataDespesa = new DateOnly(2030, 1, 2) }, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.NotNull(created.Headers.Location);
        var despesa = (await created.Content.ReadFromJsonAsync<Despesa>(token))!;
        Assert.Equal(12.50m, despesa.Valor);
        Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
        var update = await client.PutAsJsonAsync(created.Headers.Location, new AtualizarDespesaDto { Descricao = "Editada", Categoria = "Teste", Valor = 20m, DataDespesa = new DateOnly(2030, 1, 3) }, token);
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        var edited = (await client.GetFromJsonAsync<Despesa>(created.Headers.Location, token))!;
        Assert.Equal(despesa.Id, edited.Id); Assert.Equal(despesa.DataCadastro, edited.DataCadastro);
        Assert.Equal("Editada", edited.Descricao); Assert.Equal(20m, edited.Valor);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync(created.Headers.Location, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(created.Headers.Location, token)).StatusCode);
    }

    [Fact]
    public async Task Relatorio_MantemTotaisPeriodoECancelamentoSemApagarDespesas()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid viagemId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var viagem = new Viagem { Origem = "Teste", Destino = "Teste", DataViagem = new DateOnly(2030, 1, 2), ValorFrete = 1000m, Status = "Planejada" };
            context.Viagens.AddRange(viagem, new() { DataViagem = new DateOnly(2030, 1, 3), ValorFrete = 500m, Status = "Cancelada" }, new() { DataViagem = new DateOnly(2031, 1, 1), ValorFrete = 300m, Status = null });
            context.Despesas.AddRange(new() { Viagem = viagem, Descricao = "Teste", Valor = 200m, DataDespesa = new DateOnly(2030, 1, 2) }, new() { Descricao = "Outro periodo", Valor = 50m, DataDespesa = new DateOnly(2031, 1, 1) });
            await context.SaveChangesAsync(token); viagemId = viagem.Id;
        }
        var all = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(1300m, all.TotalFretes); Assert.Equal(250m, all.TotalDespesas); Assert.Equal(1050m, all.Lucro);
        var period = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro?dataInicial=2030-01-02&dataFinal=2030-01-02", token))!;
        Assert.Equal(1000m, period.TotalFretes); Assert.Equal(200m, period.TotalDespesas); Assert.Equal(800m, period.Lucro);
        var cancelamento = (await client.GetFromJsonAsync<ResumoCancelamentoDto>($"/api/Viagens/{viagemId}/cancelamento", token))!;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"/api/Viagens/{viagemId}/cancelamento", new CancelamentoViagemDto { ManterDespesas = true, VersaoDespesas = cancelamento.VersaoDespesas }, token)).StatusCode);
        var after = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(300m, after.TotalFretes); Assert.Equal(250m, after.TotalDespesas);
        Assert.Equal(2, (await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!.Length);
        Assert.Equal(3, (await client.GetFromJsonAsync<Viagem[]>("/api/Viagens", token))!.Length);
    }

    [Theory]
    [InlineData("Planejada", 204)]
    [InlineData("Em andamento", 204)]
    [InlineData("Cancelada", 204)]
    [InlineData("Concluída", 400)]
    public async Task DeleteViagem_MantemRotaLegadaEAplicaRegras(string status, int esperado)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var viagem = new Viagem { Status = status }; context.Viagens.Add(viagem);
            await context.SaveChangesAsync(token); id = viagem.Id;
        }
        Assert.Equal(esperado, (int)(await client.DeleteAsync($"/api/Viagens/{id}", token)).StatusCode);
        var persisted = (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!;
        Assert.Equal(esperado == 204 ? "Cancelada" : status, persisted.Status);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/Viagens/{Guid.NewGuid()}", token)).StatusCode);
    }

    [Fact]
    public async Task ViagemGet_PreservaEntidadesAninhadasSemCamposPlanos()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var viagem = new Viagem { Motorista = new() { Nome = "Teste", Ativo = true }, Caminhao = new() { Placa = "TESTE01", Modelo = "Teste" } };
            context.Viagens.Add(viagem); await context.SaveChangesAsync(token); id = viagem.Id;
        }
        var response = await client.GetAsync($"/api/Viagens/{id}", token);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(token));
        Assert.Equal("Teste", json.RootElement.GetProperty("motorista").GetProperty("nome").GetString());
        Assert.Equal("TESTE01", json.RootElement.GetProperty("caminhao").GetProperty("placa").GetString());
        Assert.False(json.RootElement.TryGetProperty("motoristaNome", out _));
    }
}
