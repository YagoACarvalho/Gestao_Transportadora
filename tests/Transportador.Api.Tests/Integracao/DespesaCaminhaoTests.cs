using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class DespesaCaminhaoTests
{
    [Theory]
    [InlineData("ativo", 201)]
    [InlineData("inativo", 400)]
    [InlineData("inexistente", 400)]
    [InlineData("viagem", 400)]
    public async Task CadastroValidaVinculo(string caso, int esperado)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var caminhao = new Caminhao { Placa = "ABC1234", Modelo = "Teste", Ativo = caso != "inativo" };
        var viagem = new Viagem { CaminhaoId = caminhao.Id };
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Caminhoes.Add(caminhao); db.Viagens.Add(viagem); await db.SaveChangesAsync(token);
        }
        var response = await client.PostAsJsonAsync("/api/Despesas", new {
            descricao = "Manutencao", categoria = "Oficina", valor = 100, dataDespesa = "2030-01-02",
            caminhaoId = caso == "inexistente" ? Guid.NewGuid() : caminhao.Id,
            viagemId = caso == "viagem" ? (Guid?)viagem.Id : null
        }, token);
        Assert.Equal(esperado, (int)response.StatusCode);
        if (esperado != 201) return;
        var salvo = (await client.GetFromJsonAsync<Despesa>(response.Headers.Location, token))!;
        Assert.Equal(caminhao.Id, salvo.CaminhaoId); Assert.Null(salvo.ViagemId);
        Assert.Equal("ABC1234", salvo.Caminhao!.Placa);
        var lista = (await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!;
        Assert.Equal(caminhao.Id, Assert.Single(lista).Caminhao!.Id);
        var resumo = (await client.GetFromJsonAsync<ResumoFinanceiroDto>("/api/Relatorios/resumo-financeiro", token))!;
        Assert.Equal(100m, resumo.TotalDespesasGerais); Assert.Equal(100m, resumo.TotalDespesas);
        Assert.Equal(0m, resumo.TotalDespesasViagens);
    }

    [Fact]
    public async Task EdicaoPreservaHistoricoInativoEPermiteRemoverVinculo()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var caminhao = new Caminhao { Placa = "ABC1234", Modelo = "Teste", Ativo = false };
        var outro = new Caminhao { Placa = "DEF1234", Modelo = "Outro", Ativo = false };
        var despesa = new Despesa { Caminhao = caminhao, Valor = 20, Descricao = "Teste", Categoria = "Teste", DataDespesa = new(2030, 1, 2) };
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Caminhoes.Add(outro); db.Despesas.Add(despesa); await db.SaveChangesAsync(token);
        }
        var dto = new AtualizarDespesaDto { CaminhaoId = caminhao.Id, Descricao = "Editada", Categoria = "Oficina", Valor = 25, DataDespesa = new(2030, 1, 2) };
        var path = $"/api/Despesas/{despesa.Id}";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(path, dto, token)).StatusCode);
        dto.CaminhaoId = outro.Id;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(path, dto, token)).StatusCode);
        dto.CaminhaoId = null;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(path, dto, token)).StatusCode);
        Assert.Null((await client.GetFromJsonAsync<Despesa>(path, token))!.CaminhaoId);
    }
}
