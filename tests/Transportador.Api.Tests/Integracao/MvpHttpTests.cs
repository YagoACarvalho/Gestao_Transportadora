using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class MvpHttpTests
{
    [Theory]
    [InlineData("123.456.789-01", "12345678901")]
    [InlineData(" 123.456.789-01 ", "12345678901")]
    [InlineData("12345678901", "12345678901")]
    [InlineData("  ", null)]
    public async Task Cpf_NormalizadoNoCadastroENaEdicao(string cpf, string? esperado)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var created = await client.PostAsJsonAsync("/api/Motoristas", new { nome = "Teste", cpf }, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var salvo = (await created.Content.ReadFromJsonAsync<Motorista>(token))!;
        Assert.Equal(esperado, salvo.Cpf);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(created.Headers.Location, new { nome = "Editado", cpf, ativo = true }, token)).StatusCode);
        Assert.Equal(esperado, (await client.GetFromJsonAsync<Motorista>(created.Headers.Location, token))!.Cpf);
    }

    [Theory]
    [InlineData("Motoristas", "nome", 151)]
    [InlineData("Motoristas", "cpf", 12)]
    [InlineData("Motoristas", "numeroCnh", 21)]
    [InlineData("Motoristas", "categoriaCnh", 6)]
    [InlineData("Motoristas", "telefone", 21)]
    [InlineData("Caminhoes", "placa", 11)]
    [InlineData("Caminhoes", "modelo", 101)]
    public async Task LimitesRejeitadosAntesDaPersistencia(string modulo, string campo, int tamanho)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var body = new Dictionary<string, object?> { ["nome"] = "Teste", ["placa"] = "TESTE01", ["modelo"] = "Teste", ["ativo"] = true };
        var created = await client.PostAsJsonAsync($"/api/{modulo}", body, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        body[campo] = new string('X', tamanho);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync($"/api/{modulo}", body, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(created.Headers.Location, body, token)).StatusCode);
    }

    [Theory]
    [InlineData("Motoristas", "nome")]
    [InlineData("Caminhoes", "placa")]
    [InlineData("Caminhoes", "modelo")]
    public async Task ObrigatoriosEReativacao(string modulo, string campo)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var body = new Dictionary<string, object?> { ["nome"] = "Teste", ["placa"] = "TESTE01", ["modelo"] = "Teste", ["ativo"] = true };
        var created = await client.PostAsJsonAsync($"/api/{modulo}", body, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync(created.Headers.Location, token)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(created.Headers.Location, body, token)).StatusCode);
        var data = await client.GetFromJsonAsync<System.Text.Json.JsonElement>(created.Headers.Location, token);
        Assert.True(data.GetProperty("ativo").GetBoolean());
        body[campo] = "   ";
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync($"/api/{modulo}", body, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(created.Headers.Location, body, token)).StatusCode);
    }

    [Theory]
    [InlineData("Planejada")]
    [InlineData("Em andamento")]
    [InlineData("Pausada")]
    [InlineData("Concluída")]
    [InlineData("Cancelada")]
    public async Task DespesasPermitidasEmQualquerFaseEPreservadas(string status)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var viagem = new Viagem { Status = status }; db.Viagens.Add(viagem); await db.SaveChangesAsync(token); id = viagem.Id;
        }
        var body = new CriarDespesaDto { ViagemId = id, ConsiderarNoFinanceiro = true, Descricao = "Despesa teste", Categoria = "Teste", Valor = 12.50m, DataDespesa = new(2030, 1, 2) };
        var created = await client.PostAsJsonAsync("/api/Despesas", body, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        body.Valor = 25m;
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(created.Headers.Location, body, token)).StatusCode);
        var saved = (await client.GetFromJsonAsync<Despesa>(created.Headers.Location, token))!;
        Assert.Equal(id, saved.ViagemId); Assert.Equal(25m, saved.Valor); Assert.Equal(body.DataDespesa, saved.DataDespesa);
        Assert.Equal(status, (await client.GetFromJsonAsync<Viagem>($"/api/Viagens/{id}", token))!.Status);
    }

    [Theory]
    [InlineData("descricao", "")]
    [InlineData("categoria", " ")]
    [InlineData("dataDespesa", null)]
    [InlineData("valor", null)]
    [InlineData("valor", "0")]
    [InlineData("valor", "-1")]
    [InlineData("valor", "1.001")]
    [InlineData("valor", "10000000000")]
    [InlineData("descricao", "longo")]
    [InlineData("categoria", "longo")]
    [InlineData("viagemId", "inexistente")]
    public async Task DespesaInvalida_Retorna400SemAlterarRegistro(string campo, string? valor)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var body = new Dictionary<string, object?> { ["descricao"] = "Teste", ["categoria"] = "Teste", ["valor"] = 10m, ["dataDespesa"] = "2030-01-02", ["viagemId"] = null };
        var created = await client.PostAsJsonAsync("/api/Despesas", body, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        body[campo] = campo == "valor" && valor is not null ? decimal.Parse(valor, System.Globalization.CultureInfo.InvariantCulture)
            : campo == "viagemId" ? Guid.NewGuid() : valor == "longo" ? new string('X', 201) : valor;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/Despesas", body, token)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(created.Headers.Location, body, token)).StatusCode);
        Assert.Equal(10m, (await client.GetFromJsonAsync<Despesa>(created.Headers.Location, token))!.Valor);
        Assert.Single((await client.GetFromJsonAsync<Despesa[]>("/api/Despesas", token))!);
    }

    [Fact]
    public async Task PeriodoInvertido_Retorna400()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/Relatorios/resumo-financeiro?dataInicial=2030-02-01&dataFinal=2030-01-01", token)).StatusCode);
    }

    [Theory]
    [InlineData("Motoristas")]
    [InlineData("Caminhoes")]
    [InlineData("Despesas")]
    public async Task EdicaoOuExclusaoComVersaoAntiga_Retorna409SemSobrescrever(string modulo)
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var body = new Dictionary<string, object?> { ["nome"] = "Teste", ["placa"] = "TESTE01", ["modelo"] = "Teste", ["ativo"] = true, ["descricao"] = "Teste", ["categoria"] = "Teste", ["valor"] = 10m, ["dataDespesa"] = "2030-01-02" };
        var created = await client.PostAsJsonAsync($"/api/{modulo}", body, token);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var read = await client.GetAsync(created.Headers.Location, token); Assert.NotNull(read.Headers.ETag);
        body["nome"] = "Editado"; body["modelo"] = "Editado"; body["descricao"] = "Editado";
        using var first = new HttpRequestMessage(HttpMethod.Put, created.Headers.Location) { Content = JsonContent.Create(body) };
        first.Headers.IfMatch.Add(read.Headers.ETag!);
        Assert.Equal(HttpStatusCode.NoContent, (await client.SendAsync(first, token)).StatusCode);
        foreach (var method in new[] { HttpMethod.Put, HttpMethod.Delete })
        {
            using var stale = new HttpRequestMessage(method, created.Headers.Location);
            if (method == HttpMethod.Put) stale.Content = JsonContent.Create(body);
            stale.Headers.IfMatch.Add(read.Headers.ETag!);
            Assert.Equal(HttpStatusCode.Conflict, (await client.SendAsync(stale, token)).StatusCode);
        }
    }

    [Fact]
    public async Task ViagemConcorrente_NaoPermiteReverterConclusao()
    {
        var token = TestContext.Current.CancellationToken;
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        Guid id;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var viagem = new Viagem { Origem = "Teste", Destino = "Teste", DataViagem = new(2030, 1, 2), Status = "Em andamento",
                Motorista = new() { Nome = "Teste", Ativo = true }, Caminhao = new() { Placa = "TESTE01", Modelo = "Teste" } };
            db.Viagens.Add(viagem); await db.SaveChangesAsync(token); id = viagem.Id;
        }
        var path = $"/api/Viagens/{id}";
        var read = await client.GetAsync(path, token); var atual = (await read.Content.ReadFromJsonAsync<Viagem>(token))!;
        var dto = new AtualizarViagemDto { Origem = atual.Origem, Destino = atual.Destino, DataViagem = atual.DataViagem,
            MotoristaId = atual.MotoristaId, CaminhaoId = atual.CaminhaoId, Status = "Concluída" };
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync(path, dto, token)).StatusCode);
        using var stale = new HttpRequestMessage(HttpMethod.Delete, path); stale.Headers.IfMatch.Add(read.Headers.ETag!);
        Assert.Equal(HttpStatusCode.Conflict, (await client.SendAsync(stale, token)).StatusCode);
        Assert.Equal("Concluída", (await client.GetFromJsonAsync<Viagem>(path, token))!.Status);
    }
}
