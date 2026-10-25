using System.Net;
using System.Net.Http.Json;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Caminhoes;

public class CaminhoesHttpTests
{
    [Fact]
    public async Task CicloHttp_CadastraAtivoEditaEDesativaSemExcluir()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory();
        using var client = factory.CriarCliente();
        var created = await client.PostAsJsonAsync("/api/Caminhoes", new CriarCaminhaoDto { Placa = "TESTE01", Modelo = "Modelo de teste" }, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.NotNull(created.Headers.Location);
        var caminhao = (await created.Content.ReadFromJsonAsync<Caminhao>(token))!;
        Assert.True(caminhao.Ativo);
        Assert.NotEqual(Guid.Empty, caminhao.Id);
        Assert.Equal("TESTE01", caminhao.Placa);
        Assert.Single((await client.GetFromJsonAsync<Caminhao[]>("/api/Caminhoes", token))!);

        var update = await client.PutAsJsonAsync($"/api/Caminhoes/{caminhao.Id}", new AtualizarCaminhaoDto { Placa = "TESTE02", Modelo = "Editado", Ativo = true }, token);
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Empty(await update.Content.ReadAsByteArrayAsync(token));
        var edited = (await client.GetFromJsonAsync<Caminhao>(created.Headers.Location, token))!;
        Assert.Equal("TESTE02", edited.Placa);
        Assert.Equal("Editado", edited.Modelo);
        Assert.Equal(caminhao.DataCadastro, edited.DataCadastro);
        Assert.True(edited.Ativo);

        var deleted = await client.DeleteAsync($"/api/Caminhoes/{caminhao.Id}", token);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Empty(await deleted.Content.ReadAsByteArrayAsync(token));
        Assert.Empty((await client.GetFromJsonAsync<Caminhao[]>("/api/Caminhoes", token))!);
        Assert.False((await client.GetFromJsonAsync<Caminhao>(created.Headers.Location, token))!.Ativo);
        Assert.Single((await client.GetFromJsonAsync<Caminhao[]>("/api/Caminhoes?incluirInativos=true", token))!);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/Caminhoes/{caminhao.Id}", token)).StatusCode);
    }

    [Fact]
    public async Task Listar_OrdenaPorPlacaEFiltraInativos_EdicaoPreservaInativo()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory();
        using var client = factory.CriarCliente();
        var response = await client.PostAsJsonAsync("/api/Caminhoes", new CriarCaminhaoDto { Placa = "ZZZ0001", Modelo = "Teste Z" }, token);
        var inativo = (await response.Content.ReadFromJsonAsync<Caminhao>(token))!;
        await client.PostAsJsonAsync("/api/Caminhoes", new CriarCaminhaoDto { Placa = "AAA0001", Modelo = "Teste A" }, token);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/Caminhoes/{inativo.Id}", new AtualizarCaminhaoDto { Placa = inativo.Placa, Modelo = "Editado inativo", Ativo = false }, token)).StatusCode);
        Assert.False((await client.GetFromJsonAsync<Caminhao>($"/api/Caminhoes/{inativo.Id}", token))!.Ativo);
        Assert.Equal("AAA0001", Assert.Single((await client.GetFromJsonAsync<Caminhao[]>("/api/Caminhoes", token))!).Placa);
        Assert.Equal(new[] { "AAA0001", "ZZZ0001" }, (await client.GetFromJsonAsync<Caminhao[]>("/api/Caminhoes?incluirInativos=true", token))!.Select(c => c.Placa));
    }

    [Fact]
    public async Task Inexistente_Retorna404ESemRegistrosRetornaListaVazia()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory();
        using var client = factory.CriarCliente();
        Assert.Empty((await client.GetFromJsonAsync<Caminhao[]>("/api/Caminhoes?incluirInativos=true", token))!);
        var path = $"/api/Caminhoes/{Guid.NewGuid()}";
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(path, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync(path, new AtualizarCaminhaoDto { Placa = "TESTE01", Modelo = "Teste", Ativo = true }, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync(path, token)).StatusCode);
    }
}
