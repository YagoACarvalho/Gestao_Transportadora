using System.Net;
using Xunit;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Transportador.Api.Fretes;
using Transportador.Api.Tests.Infraestrutura;

namespace Transportador.Api.Tests.Fretes;

public sealed class FretesHttpTests
{
    private sealed class MapasFalsos : IMapasFrete
    {
        public bool Configurado => true;
        public List<EnderecoFrete[]> Rotas { get; } = [];
        public Task<EnderecoFrete[]> Sugerir(string texto, CancellationToken ct) => Task.FromResult<EnderecoFrete[]>([new(texto, new(-23.55, -46.63))]);
        public Task<EnderecoFrete> Localizar(EnderecoFrete e, CancellationToken ct) => Task.FromResult(e with { Ponto = e.Ponto ?? new(-23.55, -46.63) });
        public Task<RotaFrete> Rota(EnderecoFrete[] pontos, EntradaFrete entrada, CancellationToken ct)
        {
            Rotas.Add(pontos); decimal distancia = Rotas.Count % 2 == 1 ? 200 : 230;
            return Task.FromResult(new RotaFrete(distancia, Enumerable.Repeat(distancia / (pontos.Length - 1), pontos.Length - 1).ToArray(), pontos.Select(p => p.Ponto!).ToArray()));
        }
    }
    private static EntradaFrete Entrada() => new() { Origem = new("Coleta de teste"), Destino = new("Entrega de teste"), TipoCarga = 5, Eixos = 4, Contratacao = "tracao", RetornoEspecial = true, DataReferencia = new(2026, 10, 1) };
    private static WebApplicationFactoryMapas ComMapas(ApiFactory factory, MapasFalsos mapas) => new(factory, mapas);
    private sealed class WebApplicationFactoryMapas : IDisposable
    {
        private readonly Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> app;
        public HttpClient Cliente { get; }
        public WebApplicationFactoryMapas(ApiFactory factory, MapasFalsos mapas)
        {
            app = factory.WithWebHostBuilder(b => b.ConfigureTestServices(s => { s.RemoveAll<IMapasFrete>(); s.AddSingleton<IMapasFrete>(mapas); }));
            Cliente = app.CreateClient(new() { BaseAddress = new("https://localhost"), AllowAutoRedirect = false });
            Cliente.DefaultRequestHeaders.Authorization = new("Teste", "permitido");
        }
        public void Dispose() { Cliente.Dispose(); app.Dispose(); }
    }
    [Fact]
    public async Task CalculaSemPersistenciaComRetornoIndependenteEPedagioPendente()
    {
        using var factory = new ApiFactory(); var mapas = new MapasFalsos(); using var app = ComMapas(factory, mapas);
        var e = Entrada(); e.Paradas.Add(new("Parada de teste"));
        var resposta = await app.Cliente.PostAsJsonAsync("/api/fretes/calcular", e);
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var r = (await resposta.Content.ReadFromJsonAsync<ResultadoFrete>())!;
        Assert.Equal(200, r.DistanciaKm); Assert.Equal(230, r.DistanciaRetornoKm);
        Assert.Equal(3, mapas.Rotas[0].Length); Assert.Equal(2, mapas.Rotas[1].Length);
        Assert.Equal("Entrega de teste", mapas.Rotas[1][0].Texto); Assert.Equal("Coleta de teste", mapas.Rotas[1][1].Texto);
        Assert.Null(r.Pedagio); Assert.Contains(r.Avisos, a => a.StartsWith("Pedágio pendente"));
        Assert.Equal(2737.02m, r.PisoTotal);
    }
    [Fact]
    public async Task SemChaveRetorna503EOpcoesInformaPendencia()
    {
        using var factory = new ApiFactory(); using var app = factory.WithWebHostBuilder(b => b.UseSetting("Fretes:OrsApiKey", ""));
        using var client = app.CreateClient(new() { BaseAddress = new("https://localhost") }); client.DefaultRequestHeaders.Authorization = new("Teste", "permitido");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/fretes/calcular", Entrada())).StatusCode);
        var json = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/fretes/opcoes"); Assert.False(json.GetProperty("mapasConfigurados").GetBoolean());
    }
    [Theory]
    [InlineData("/api/fretes/opcoes")]
    [InlineData("/api/fretes/sugestoes?texto=teste")]
    [InlineData("/api/fretes/mapa-tiles/5/11/17")]
    public async Task ExigeAutenticacao(string path)
    {
        using var factory = new ApiFactory(autenticar: false); using var client = factory.CriarCliente();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/fretes/calcular", Entrada())).StatusCode);
    }
    [Theory]
    [InlineData("paradas")] [InlineData("decimal")] [InlineData("exterior")] [InlineData("origem")]
    public async Task ValidaEntradasAntesDeChamarProvedor(string caso)
    {
        using var factory = new ApiFactory(); var mapas = new MapasFalsos(); using var app = ComMapas(factory, mapas);
        var e = Entrada();
        if (caso == "paradas") e.Paradas = Enumerable.Repeat(new EnderecoFrete("Parada de teste"), 6).ToList();
        if (caso == "decimal") e.Pedagio = 1.234m;
        if (caso == "exterior") e.Origem = new("Exterior", new(50, 2));
        if (caso == "origem") e.Origem = null!;
        Assert.Equal(HttpStatusCode.BadRequest, (await app.Cliente.PostAsJsonAsync("/api/fretes/calcular", e)).StatusCode);
        Assert.Empty(mapas.Rotas);
    }
    [Fact]
    public async Task LimitaCalculosPorUsuario()
    {
        using var factory = new ApiFactory(); using var app = ComMapas(factory, new());
        for (int i = 0; i < 10; i++) Assert.Equal(HttpStatusCode.OK, (await app.Cliente.PostAsJsonAsync("/api/fretes/calcular", Entrada())).StatusCode);
        var resposta = await app.Cliente.PostAsJsonAsync("/api/fretes/calcular", Entrada());
        Assert.Equal(HttpStatusCode.TooManyRequests, resposta.StatusCode); Assert.NotNull(resposta.Headers.RetryAfter);
    }
}
