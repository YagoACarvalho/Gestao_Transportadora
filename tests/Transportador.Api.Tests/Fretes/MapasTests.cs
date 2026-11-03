using System.Net;
using System.Net.Http.Json;
using Xunit;
using System.Text;
using Microsoft.Extensions.Configuration;
using Transportador.Api.Fretes;

namespace Transportador.Api.Tests.Fretes;

public sealed class MapasTests
{
    private sealed class Handler(Func<HttpRequestMessage, HttpResponseMessage> resposta) : HttpMessageHandler
    {
        public int Chamadas { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) { Chamadas++; return Task.FromResult(resposta(request)); }
    }
    private static ClienteMapas Cliente(Handler handler, bool chave = true) => new(new HttpClient(handler), new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Fretes:OrsApiKey"] = chave ? "chave-ficticia-teste" : null }).Build());
    [Theory]
    [InlineData("https://outro.invalid/pelias/v1/search")]
    [InlineData("http://api.heigit.org/pelias/v1/search")]
    [InlineData("https://api.heigit.org/pelias/v1/search/extra")]
    [InlineData("https://user@api.heigit.org/pelias/v1/search")]
    public async Task RecusaDestinosForaDaLista(string url)
    {
        var handler = new Handler(_ => throw new Exception("Não deveria chamar a rede."));
        await Assert.ThrowsAsync<InvalidOperationException>(() => Cliente(handler).Json(HttpMethod.Get, url, null, default));
        Assert.Equal(0, handler.Chamadas);
    }
    [Fact]
    public async Task SemChaveNaoChamaRede()
    {
        var handler = new Handler(_ => throw new Exception());
        var erro = await Assert.ThrowsAsync<FalhaFrete>(() => Cliente(handler, false).Json(HttpMethod.Get, ClienteMapas.Busca, null, default));
        Assert.Equal(503, erro.Status); Assert.Equal(0, handler.Chamadas);
    }
    [Fact]
    public async Task ChaveVaiApenasNoCabecalhoERedirecionamentoNaoRetornaDados()
    {
        var handler = new Handler(r => {
            Assert.Equal("chave-ficticia-teste", r.Headers.GetValues("Authorization").Single());
            Assert.DoesNotContain("chave-ficticia", r.RequestUri!.ToString());
            return new(HttpStatusCode.Redirect) { Headers = { Location = new("https://outro.invalid") } };
        });
        var erro = await Assert.ThrowsAsync<FalhaFrete>(() => Cliente(handler).Json(HttpMethod.Get, ClienteMapas.Busca, null, default));
        Assert.DoesNotContain("chave-ficticia", erro.Message); Assert.Equal(1, handler.Chamadas);
    }
    [Fact]
    public async Task RecusaRespostaGrande()
    {
        var handler = new Handler(_ => new(HttpStatusCode.OK) { Content = new StringContent(new string('x', 1024 * 1024 + 1)) });
        var erro = await Assert.ThrowsAsync<FalhaFrete>(() => Cliente(handler).Json(HttpMethod.Get, ClienteMapas.Busca, null, default));
        Assert.Equal(502, erro.Status);
    }
    private static string Feature(double lon, double lat) => System.Text.Json.JsonSerializer.Serialize(new { geometry = new { coordinates = new[] { lon, lat } }, properties = new { label = "Endere?o de teste", country_a = "BRA" } });
    [Theory]
    [InlineData(-23.5501, false)] [InlineData(-22.0, true)]
    public async Task AmbiguidadeSoBloqueiaResultadosDistantes(double segundaLat, bool bloqueia)
    {
        var handler = new Handler(_ => new(HttpStatusCode.OK) { Content = new StringContent("{\"features\":[" + Feature(-46.63, -23.55) + "," + Feature(-46.63, segundaLat) + "]}", Encoding.UTF8, "application/json") });
        var mapas = new MapasOrs(Cliente(handler));
        if (bloqueia) Assert.Equal(400, (await Assert.ThrowsAsync<FalhaFrete>(() => mapas.Localizar(new("Rua de teste"), default))).Status);
        else Assert.NotNull((await mapas.Localizar(new("Rua de teste"), default)).Ponto);
    }
    [Fact]
    public async Task PontoSelecionadoDispensaBuscaERecusaForaDoBrasil()
    {
        var handler = new Handler(_ => throw new Exception()); var mapas = new MapasOrs(Cliente(handler));
        var endereco = new EnderecoFrete("São Paulo", new(-23.55, -46.63));
        Assert.Equal(endereco, await mapas.Localizar(endereco, default));
        await Assert.ThrowsAsync<FalhaFrete>(() => mapas.Localizar(new("Exterior", new(40, 2)), default));
        Assert.Equal(0, handler.Chamadas);
    }
    [Fact]
    public async Task RotaEnviaParadasEMedidasComLongitudePrimeiro()
    {
        var handler = new Handler(r => {
            var texto = r.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            Assert.Contains("[-46.63,-23.55]", texto); Assert.Contains("\"height\":4", texto); Assert.Contains("\"hazmat\":true", texto);
            return new(HttpStatusCode.OK) { Content = new StringContent("""{"features":[{"properties":{"summary":{"distance":200000},"segments":[{"distance":90000},{"distance":110000}],"way_points":[0,1,2]},"geometry":{"coordinates":[[-46.63,-23.55],[-46.4,-23.3],[-46.0,-23.0]]}}]}""") };
        });
        var rota = await new MapasOrs(Cliente(handler)).Rota([new("Coleta", new(-23.55, -46.63)), new("Parada", new(-23.3, -46.4)), new("Entrega", new(-23, -46))], new() { Altura = 4, TipoCarga = 7 }, default);
        Assert.Equal(200, rota.DistanciaKm); Assert.Equal(new decimal[] { 90, 110 }, rota.TrechosKm); Assert.Equal(3, rota.Trajeto.Length);
    }
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(5)]
    public async Task SolicitaInstrucoesParaOrsPreservarDistanciasDosTrechos(int paradas)
    {
        int quantidadeTrechos = paradas + 1;
        var pontos = Enumerable.Range(0, quantidadeTrechos + 1)
            .Select(i => new EnderecoFrete($"Ponto de teste {i}", new(-23.55 + i * .01, -46.63 + i * .01))).ToArray();
        var handler = new Handler(request =>
        {
            using var corpo = System.Text.Json.JsonDocument.Parse(request.Content!.ReadAsStringAsync().GetAwaiter().GetResult());
            // RouteResultBuilder do ORS limpa os segmentos quando instructions=false.
            bool incluirTrechos = !corpo.RootElement.TryGetProperty("instructions", out var instructions) || instructions.GetBoolean();
            var segmentos = incluirTrechos ? Enumerable.Repeat(new { distance = 10000 }, quantidadeTrechos).ToArray() : [];
            var resposta = new
            {
                features = new[] { new {
                    properties = new { summary = new { distance = quantidadeTrechos * 10000 }, segments = segmentos, way_points = Enumerable.Range(0, pontos.Length).ToArray() },
                    geometry = new { type = "LineString", coordinates = pontos.Select(p => new[] { p.Ponto!.Lon, p.Ponto.Lat }).ToArray() }
                } }
            };
            return new(HttpStatusCode.OK) { Content = JsonContent.Create(resposta) };
        });
        var rota = await new MapasOrs(Cliente(handler)).Rota(pontos, new(), TestContext.Current.CancellationToken);
        Assert.Equal(quantidadeTrechos * 10m, rota.DistanciaKm);
        Assert.Equal(quantidadeTrechos, rota.TrechosKm.Length);
        Assert.All(rota.TrechosKm, trecho => Assert.Equal(10m, trecho));
        Assert.Equal(rota.DistanciaKm, rota.TrechosKm.Sum());
        Assert.Equal(1, handler.Chamadas);
    }
}
