using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Motoristas;

public class MotoristasHttpTests
{
    [Fact]
    public async Task CicloHttp_CadastraAtivoAtualizaEDesativaPreservandoDataCivil()
    {
        using var factory = new ApiFactory();
        using var client = factory.CriarCliente();
        var data = new DateOnly(2030, 1, 2);
        var created = await client.PostAsJsonAsync("/api/Motoristas", new CriarMotoristaDto { Nome = "Teste HTTP", DataValidadeCnh = data });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.NotNull(created.Headers.Location);
        var motorista = (await created.Content.ReadFromJsonAsync<Motorista>())!;
        Assert.True(motorista.Ativo);
        using var json = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        Assert.Equal("2030-01-02", json.RootElement.GetProperty("dataValidadeCnh").GetString());
        Assert.Single((await client.GetFromJsonAsync<Motorista[]>("/api/Motoristas"))!);
        Assert.True((await client.GetFromJsonAsync<Motorista>(created.Headers.Location))!.Ativo);

        var update = await client.PutAsJsonAsync($"/api/Motoristas/{motorista.Id}", new AtualizarMotoristaDto { Nome = "Editado", Ativo = true, DataValidadeCnh = data });
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Empty(await update.Content.ReadAsByteArrayAsync());
        var edited = (await client.GetFromJsonAsync<Motorista>($"/api/Motoristas/{motorista.Id}"))!;
        Assert.Equal("Editado", edited.Nome);
        Assert.True(edited.Ativo);
        Assert.Equal(data, edited.DataValidadeCnh);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/Motoristas/{motorista.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<Motorista[]>("/api/Motoristas"))!);
        var inativos = (await client.GetFromJsonAsync<Motorista[]>("/api/Motoristas?incluirInativos=true"))!;
        Assert.False(Assert.Single(inativos).Ativo);
    }

    [Fact]
    public async Task CadastroSemNome_Retorna400SemPersistir()
    {
        using var factory = new ApiFactory();
        using var client = factory.CriarCliente();
        var response = await client.PostAsJsonAsync("/api/Motoristas", new { nome = "" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.GetProperty("errors").TryGetProperty("Nome", out _));
        Assert.Empty((await client.GetFromJsonAsync<Motorista[]>("/api/Motoristas?incluirInativos=true"))!);
    }

    [Fact]
    public async Task IdInexistente_Retorna404EmConsultaAtualizacaoEDesativacao()
    {
        using var factory = new ApiFactory();
        using var client = factory.CriarCliente();
        var path = $"/api/Motoristas/{Guid.NewGuid()}";
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync(path, new AtualizarMotoristaDto { Nome = "Teste", Ativo = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync(path)).StatusCode);
    }
}
