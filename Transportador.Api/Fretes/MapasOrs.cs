using System.Text.Json;

namespace Transportador.Api.Fretes;

public interface IMapasFrete
{
    bool Configurado { get; }
    Task<EnderecoFrete[]> Sugerir(string texto, CancellationToken ct);
    Task<EnderecoFrete> Localizar(EnderecoFrete endereco, CancellationToken ct);
    Task<RotaFrete> Rota(EnderecoFrete[] pontos, EntradaFrete entrada, CancellationToken ct);
}

public sealed class MapasOrs(ClienteMapas cliente) : IMapasFrete
{
    public bool Configurado => cliente.Configurado;
    private async Task<EnderecoFrete[]> Consultar(string url, string texto, CancellationToken ct)
    {
        using var json = await cliente.Json(HttpMethod.Get, $"{url}?text={Uri.EscapeDataString(texto.Trim())}&boundary.country=BRA&size=6", null, ct);
        try
        {
            return json.RootElement.GetProperty("features").EnumerateArray().Take(6).Select(f =>
            {
                var coords = f.GetProperty("geometry").GetProperty("coordinates");
                var ponto = new PontoFrete(coords[1].GetDouble(), coords[0].GetDouble());
                string? pais = f.GetProperty("properties").TryGetProperty("country_a", out var country) ? country.GetString() : null;
                return pais is not null && pais != "BRA" || !NoBrasil(ponto) ? null : new EnderecoFrete(f.GetProperty("properties").GetProperty("label").GetString()!, ponto);
            }).OfType<EnderecoFrete>().Where(e => !string.IsNullOrWhiteSpace(e.Texto) && e.Texto.Length <= 250).ToArray();
        }
        catch (Exception e) when (e is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException or FormatException)
        { throw new FalhaFrete(502, "mapas", "O provedor retornou endereços inválidos."); }
    }
    public Task<EnderecoFrete[]> Sugerir(string texto, CancellationToken ct) => Consultar(ClienteMapas.Sugestoes, texto, ct);
    public async Task<EnderecoFrete> Localizar(EnderecoFrete endereco, CancellationToken ct)
    {
        if (endereco.Ponto is not null)
        {
            if (!NoBrasil(endereco.Ponto)) throw new FalhaFrete(400, "enderecos", "Informe um ponto dentro do Brasil.");
            return endereco;
        }
        var candidatos = await Consultar(ClienteMapas.Busca, endereco.Texto, ct);
        if (candidatos.Length == 0) throw new FalhaFrete(400, "enderecos", $"Endereço não encontrado: {endereco.Texto}. Informe cidade e estado.");
        if (candidatos.Length > 1 && MetrosEntre(candidatos[0].Ponto!, candidatos[1].Ponto!) > 500)
            throw new FalhaFrete(400, "enderecos", $"Endereço ambíguo: {endereco.Texto}. Escolha uma sugestão ou detalhe o endereço.");
        return candidatos[0];
    }
    public static bool NoBrasil(PontoFrete p) => double.IsFinite(p.Lat) && double.IsFinite(p.Lon) && p.Lat is >= -34.5 and <= 5.5 && p.Lon is >= -74.5 and <= -28.5;
    public static double MetrosEntre(PontoFrete a, PontoFrete b)
    {
        double Rad(double d) => d * Math.PI / 180;
        double h = Math.Pow(Math.Sin(Rad(b.Lat - a.Lat) / 2), 2) + Math.Cos(Rad(a.Lat)) * Math.Cos(Rad(b.Lat)) * Math.Pow(Math.Sin(Rad(b.Lon - a.Lon) / 2), 2);
        return 6371000 * 2 * Math.Asin(Math.Sqrt(Math.Clamp(h, 0, 1)));
    }
    public async Task<RotaFrete> Rota(EnderecoFrete[] pontos, EntradaFrete entrada, CancellationToken ct)
    {
        var restricoes = new Dictionary<string, object>();
        if (entrada.Altura is decimal a) restricoes["height"] = a;
        if (entrada.Largura is decimal l) restricoes["width"] = l;
        if (entrada.Comprimento is decimal c) restricoes["length"] = c;
        if (entrada.Peso is decimal p) restricoes["weight"] = p;
        if (entrada.TipoCarga is >= 7 and <= 11) restricoes["hazmat"] = true;
        var corpo = new Dictionary<string, object> { ["coordinates"] = pontos.Select(p => new[] { p.Ponto!.Lon, p.Ponto.Lat }).ToArray(), ["instructions"] = false };
        if (restricoes.Count > 0) corpo["options"] = new { profile_params = new { restrictions = restricoes } };
        using var json = await cliente.Json(HttpMethod.Post, ClienteMapas.Direcoes, corpo, ct);
        try
        {
            var feature = json.RootElement.GetProperty("features")[0];
            var props = feature.GetProperty("properties");
            decimal km = props.GetProperty("summary").GetProperty("distance").GetDecimal() / 1000m;
            var trechos = props.GetProperty("segments").EnumerateArray().Select(s => s.GetProperty("distance").GetDecimal() / 1000m).ToArray();
            var coords = feature.GetProperty("geometry").GetProperty("coordinates").EnumerateArray().Select(c => new PontoFrete(c[1].GetDouble(), c[0].GetDouble())).ToArray();
            if (km <= 0 || km > 50000 || trechos.Length != pontos.Length - 1 || trechos.Any(t => t < 0) || coords.Length < 2 || coords.Any(c => !NoBrasil(c)))
                throw new InvalidOperationException();
            trechos = AjustarTrechos(km, trechos);
            // Preserva extremos e pontos de passagem, amostrando apenas a geometria exibida.
            var indices = new SortedSet<int> { 0, coords.Length - 1 };
            if (props.TryGetProperty("way_points", out var waypoints))
                foreach (var wp in waypoints.EnumerateArray().Take(pontos.Length)) if (wp.GetInt32() >= 0 && wp.GetInt32() < coords.Length) indices.Add(wp.GetInt32());
            int disponiveis = 800 - indices.Count;
            for (int i = 0; i < disponiveis; i++) indices.Add((int)((long)i * (coords.Length - 1) / Math.Max(1, disponiveis - 1)));
            return new(km, trechos, indices.Select(i => coords[i]).ToArray());
        }
        catch (Exception e) when (e is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException or FormatException or OverflowException)
        { throw new FalhaFrete(502, "mapas", "O provedor retornou uma rota inválida."); }
    }
    public static decimal[] AjustarTrechos(decimal km, decimal[] trechos)
    {
        var soma = trechos.Sum();
        if (soma <= 0) throw new InvalidOperationException();
        var resultado = trechos.Select(t => decimal.Round(t * km / soma, 6, MidpointRounding.AwayFromZero)).ToArray();
        resultado[^1] += km - resultado.Sum();
        return resultado;
    }
}
