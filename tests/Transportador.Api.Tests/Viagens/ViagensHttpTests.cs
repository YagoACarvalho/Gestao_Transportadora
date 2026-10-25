using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Viagens;

public class ViagensHttpTests
{
    private static async Task<CriarViagemDto> Dados(HttpClient client)
    {
        var token = TestContext.Current.CancellationToken;
        var motorista = await client.PostAsJsonAsync("/api/Motoristas", new CriarMotoristaDto { Nome = "Motorista de teste" }, token);
        var caminhao = await client.PostAsJsonAsync("/api/Caminhoes", new CriarCaminhaoDto { Placa = "TESTE01", Modelo = "Teste" }, token);
        return new() { Origem = "Origem de teste", Destino = "Destino de teste", DataViagem = new DateOnly(2030, 1, 2), MotoristaId = (await motorista.Content.ReadFromJsonAsync<Motorista>(token))!.Id, CaminhaoId = (await caminhao.Content.ReadFromJsonAsync<Caminhao>(token))!.Id, ValorFrete = 1500.50m };
    }

    private static AtualizarViagemDto Atualizacao(CriarViagemDto dto, string status) => new()
    {
        Origem = dto.Origem, Destino = dto.Destino, DataViagem = dto.DataViagem,
        MotoristaId = dto.MotoristaId, CaminhaoId = dto.CaminhaoId, ValorFrete = dto.ValorFrete, Status = status,
    };

    [Fact]
    public async Task CicloHttp_PlanejadaEdicaoInicioConclusao_PreservaIdentidadeDataEFrete()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var dto = await Dados(client);
        // O cliente nao controla a situacao inicial, mesmo enviando propriedade extra.
        var body = JsonSerializer.SerializeToNode(dto)!; body["Status"] = "Cancelada";
        var response = await client.PostAsJsonAsync("/api/Viagens", body, token);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var created = (await response.Content.ReadFromJsonAsync<Viagem>(token))!;
        Assert.Equal("Planejada", created.Status);
        Assert.Equal(1500.50m, created.ValorFrete);
        var related = (await client.GetFromJsonAsync<Viagem>(response.Headers.Location, token))!;
        Assert.Equal("Motorista de teste", related.Motorista!.Nome);
        Assert.Equal("TESTE01", related.Caminhao!.Placa);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(token));
        Assert.Equal("2030-01-02", json.RootElement.GetProperty("dataViagem").GetString());
        Assert.True(json.RootElement.TryGetProperty("motorista", out _));
        Assert.False(json.RootElement.TryGetProperty("motoristaNome", out _));
        var update = Atualizacao(dto, "Planejada"); update.Destino = "Destino editado";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(response.Headers.Location, update, token)).StatusCode);
        update.Status = "Em andamento";
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(response.Headers.Location, update, token)).StatusCode);
        update.Status = "Concluída";
        var complete = await client.PutAsJsonAsync(response.Headers.Location, update, token);
        Assert.Equal(HttpStatusCode.NoContent, complete.StatusCode);
        Assert.Empty(await complete.Content.ReadAsByteArrayAsync(token));
        var persisted = (await client.GetFromJsonAsync<Viagem>(response.Headers.Location, token))!;
        Assert.Equal(created.Id, persisted.Id); Assert.Equal(created.DataCadastro, persisted.DataCadastro);
        Assert.Equal(dto.DataViagem, persisted.DataViagem); Assert.Equal(dto.ValorFrete, persisted.ValorFrete);
        Assert.Equal("Destino editado", persisted.Destino); Assert.Equal("Concluída", persisted.Status);
        Assert.Single((await client.GetFromJsonAsync<Viagem[]>("/api/Viagens", token))!);
    }

    [Theory]
    [InlineData("Planejada", "Planejada", true)]
    [InlineData("Planejada", "Em andamento", true)]
    [InlineData("Planejada", "Concluída", false)]
    [InlineData("Planejada", "Cancelada", true)]
    [InlineData("Em andamento", "Planejada", false)]
    [InlineData("Em andamento", "Em andamento", true)]
    [InlineData("Em andamento", "Concluída", true)]
    [InlineData("Em andamento", "Cancelada", true)]
    [InlineData("Concluída", "Planejada", false)]
    [InlineData("Concluída", "Em andamento", false)]
    [InlineData("Concluída", "Concluída", true)]
    [InlineData("Concluída", "Cancelada", false)]
    [InlineData("Cancelada", "Planejada", false)]
    [InlineData("Cancelada", "Em andamento", false)]
    [InlineData("Cancelada", "Concluída", false)]
    [InlineData("Cancelada", "Cancelada", true)]
    [InlineData("Planejada", "Desconhecida", false)]
    public async Task Atualizar_RespeitaTransicoes(string atual, string novo, bool permitido)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var dto = await Dados(client);
        var id = await Preparar(factory, dto, atual);
        var response = await client.PutAsJsonAsync($"/api/Viagens/{id}", Atualizacao(dto, novo), token);
        Assert.Equal(permitido ? HttpStatusCode.NoContent : HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(permitido ? novo : atual, (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!.Status);
    }

    private static async Task<Guid> Preparar(ApiFactory factory, CriarViagemDto dto, string? status)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var viagem = new Viagem { Origem = dto.Origem, Destino = dto.Destino, DataViagem = dto.DataViagem, MotoristaId = dto.MotoristaId, CaminhaoId = dto.CaminhaoId, ValorFrete = dto.ValorFrete, Status = status };
        context.Viagens.Add(viagem); await context.SaveChangesAsync(TestContext.Current.CancellationToken); return viagem.Id;
    }

    [Theory]
    [InlineData("Em andamento")]
    [InlineData("Concluída")]
    [InlineData("Cancelada")]
    public async Task Atualizar_DadosForaDePlanejada_Retorna400SemPersistir(string status)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dto = await Dados(client);
        var id = await Preparar(factory, dto, status); var update = Atualizacao(dto, status); update.Origem = "Alteracao proibida";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/Viagens/{id}", update, token)).StatusCode);
        Assert.Equal(dto.Origem, (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!.Origem);
    }

    [Theory]
    [InlineData("Origem")]
    [InlineData("Destino")]
    [InlineData("DataViagem")]
    [InlineData("MotoristaId")]
    [InlineData("CaminhaoId")]
    public async Task CadastroSemCampoObrigatorio_Retorna400(string campo)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dto = await Dados(client);
        var body = JsonSerializer.SerializeToNode(dto)!; body[campo] = null;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Viagens", body, token)).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<Viagem[]>("/api/Viagens", token))!);
    }

    [Theory]
    [InlineData("-1")]
    [InlineData("1.001")]
    [InlineData("10000000000")]
    public async Task FreteInvalido_Retorna400NoCadastroENaEdicao(string frete)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dto = await Dados(client);
        var id = await Preparar(factory, dto, "Planejada");
        dto.ValorFrete = decimal.Parse(frete, System.Globalization.CultureInfo.InvariantCulture);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Viagens", dto, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/Viagens/{id}", Atualizacao(dto, "Planejada"), token)).StatusCode);
    }

    [Fact]
    public async Task VinculosNovosExigemAtivos_HistoricoInativoPermanece()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dto = await Dados(client);
        var id = await Preparar(factory, dto, "Planejada");
        await client.DeleteAsync($"/api/Motoristas/{dto.MotoristaId}", token); await client.DeleteAsync($"/api/Caminhoes/{dto.CaminhaoId}", token);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Viagens", dto, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/Viagens/{id}", Atualizacao(dto, "Em andamento"), token)).StatusCode);
        var persisted = (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!;
        Assert.False(persisted.Motorista!.Ativo); Assert.False(persisted.Caminhao!.Ativo);
        Assert.Equal(dto.MotoristaId, persisted.MotoristaId); Assert.Equal(dto.CaminhaoId, persisted.CaminhaoId);
        var other = await Dados(client); var otherId = await Preparar(factory, other, "Planejada");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/Viagens/{otherId}", Atualizacao(dto, "Planejada"), token)).StatusCode);
    }

    [Fact]
    public async Task VinculosInexistentes_Retornam400()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dto = await Dados(client);
        dto.MotoristaId = Guid.NewGuid(); dto.CaminhaoId = Guid.NewGuid();
        var result = await client.PostAsJsonAsync("/api/Viagens", dto, token);
        Assert.Equal(HttpStatusCode.BadRequest, result.StatusCode);
        using var json = JsonDocument.Parse(await result.Content.ReadAsStringAsync(token));
        Assert.True(json.RootElement.GetProperty("errors").TryGetProperty("MotoristaId", out _));
        Assert.True(json.RootElement.GetProperty("errors").TryGetProperty("CaminhaoId", out _));
    }

    [Fact]
    public async Task ConsultaLegadoNuloEFreteOpcional_SemExigirMigracao()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>(); context.Viagens.Add(new()); await context.SaveChangesAsync(token);
        }
        var legacy = Assert.Single((await client.GetFromJsonAsync<Viagem[]>("/api/Viagens", token))!);
        Assert.Null(legacy.Status); Assert.Null(legacy.Origem); Assert.Null(legacy.Motorista);
        var dto = await Dados(client); dto.ValorFrete = null;
        var created = await client.PostAsJsonAsync("/api/Viagens", dto, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Null((await created.Content.ReadFromJsonAsync<Viagem>(token))!.ValorFrete);
        var list = (await client.GetFromJsonAsync<Viagem[]>("/api/Viagens", token))!;
        Assert.Equal(legacy.Id, list.Last().Id);
        var inexistente = $"/api/Viagens/{Guid.NewGuid()}";
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(inexistente, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync(inexistente, Atualizacao(dto, "Planejada"), token)).StatusCode);
    }
}
