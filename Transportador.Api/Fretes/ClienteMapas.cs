using System.Net;
using System.Text.Json;

namespace Transportador.Api.Fretes;

// Cliente dedicado, sem logging HTTP de URLs, cabeçalhos ou corpos.
// Nenhum destino, URL base ou credencial pode vir da entrada do usuário.
public sealed class ClienteMapas(HttpClient http, IConfiguration configuration)
{
    public const string Busca = "https://api.heigit.org/pelias/v1/search";
    public const string Sugestoes = "https://api.heigit.org/pelias/v1/autocomplete";
    public const string Direcoes = "https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson";
    public bool Configurado => !string.IsNullOrWhiteSpace(configuration["Fretes:OrsApiKey"]);
    public static HttpClient CriarHttp() => new(new SocketsHttpHandler
    {
        AllowAutoRedirect = false, UseProxy = false, UseCookies = false,
        AutomaticDecompression = DecompressionMethods.None, ConnectTimeout = TimeSpan.FromSeconds(10)
    }) { Timeout = TimeSpan.FromSeconds(40) };

    public async Task<JsonDocument> Json(HttpMethod metodo, string destino, object? corpo, CancellationToken ct)
    {
        var uri = new Uri(destino, UriKind.Absolute);
        var caminho = uri.GetLeftPart(UriPartial.Path);
        if (uri.Scheme != "https" || uri.Port != 443 || uri.UserInfo != "" || uri.Fragment != "" ||
            !(metodo == HttpMethod.Get && caminho is Busca or Sugestoes || metodo == HttpMethod.Post && caminho == Direcoes && uri.Query == ""))
            throw new InvalidOperationException("Destino de mapas não permitido.");
        if (!Configurado) throw new FalhaFrete(503, "mapas", "O serviço de rotas ainda não foi configurado.");
        using var request = new HttpRequestMessage(metodo, uri);
        request.Headers.TryAddWithoutValidation("Authorization", configuration["Fretes:OrsApiKey"]);
        if (corpo is not null) request.Content = JsonContent.Create(corpo);
        var bytes = await Enviar(request, 1024 * 1024, ct);
        try { return JsonDocument.Parse(bytes); }
        catch (JsonException) { throw new FalhaFrete(502, "mapas", "O provedor retornou dados inválidos. Tente novamente."); }
    }

    public async Task<byte[]> Tile(int z, int x, int y, CancellationToken ct)
    {
        if (z is < 0 or > 19 || x < 0 || y < 0 || x >= (1 << z) || y >= (1 << z))
            throw new FalhaFrete(400, "mapa", "Coordenada de mapa inválida.");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://tile.openstreetmap.org/{z}/{x}/{y}.png");
        request.Headers.UserAgent.ParseAdd("GestaoTransportadora/1.0 (interactive freight route viewer)");
        var bytes = await Enviar(request, 1024 * 1024, ct);
        if (bytes.Length < 8 || !bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            throw new FalhaFrete(502, "mapa", "Imagem de mapa inválida.");
        return bytes;
    }

    private async Task<byte[]> Enviar(HttpRequestMessage request, int limite, CancellationToken ct)
    {
        try
        {
            using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode)
                throw new FalhaFrete(response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.NotFound ? 400 : 503,
                    "mapas", response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.NotFound ? "Não foi possível encontrar uma rota. Revise os endereços e as medidas do veículo." : "O provedor de mapas está indisponível ou atingiu sua cota. Tente novamente mais tarde.");
            if (response.Content.Headers.ContentLength > limite) throw new FalhaFrete(502, "mapas", "Resposta do provedor excedeu o limite permitido.");
            using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var buffer = new MemoryStream();
            byte[] bloco = new byte[8192];
            int lidos;
            while ((lidos = await stream.ReadAsync(bloco, ct)) != 0)
            {
                if (buffer.Length + lidos > limite) throw new FalhaFrete(502, "mapas", "Resposta do provedor excedeu o limite permitido.");
                buffer.Write(bloco, 0, lidos);
            }
            return buffer.ToArray();
        }
        catch (HttpRequestException) { throw new FalhaFrete(503, "mapas", "Não foi possível acessar o provedor de mapas."); }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested) { throw new FalhaFrete(503, "mapas", "O provedor de mapas demorou a responder. Tente novamente."); }
    }
}
