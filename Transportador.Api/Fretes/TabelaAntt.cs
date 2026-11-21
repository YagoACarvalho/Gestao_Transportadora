using System.Text.Json;

namespace Transportador.Api.Fretes;

public sealed class TabelaAntt
{
    private sealed record Linha(int TipoCarga, decimal?[] Ccd, decimal?[] Cc);
    private sealed record Dados(string Norma, DateOnly Vigencia, string Fonte, int[] Eixos, Dictionary<string, Linha[]> Tabelas);
    private readonly Dados[] versoes;
    public static readonly string[] TiposCarga = ["Granel sólido", "Granel líquido", "Frigorificada ou aquecida", "Conteinerizada", "Carga geral", "Neogranel", "Perigosa (granel sólido)", "Perigosa (granel líquido)", "Perigosa (frigorificada ou aquecida)", "Perigosa (conteinerizada)", "Perigosa (carga geral)", "Granel pressurizada"];

    public TabelaAntt()
    {
        var assembly = typeof(TabelaAntt).Assembly;
        versoes = assembly.GetManifestResourceNames().Where(n => n.Contains(".Fretes.Dados.") && n.EndsWith(".json"))
            .Select(n => { using var stream = assembly.GetManifestResourceStream(n)!; return JsonSerializer.Deserialize<Dados>(stream, new JsonSerializerOptions(JsonSerializerDefaults.Web))!; })
            .OrderBy(v => v.Vigencia).ToArray();
        if (versoes.Length == 0) throw new InvalidOperationException("Tabelas ANTT ausentes.");
    }

    public (string Norma, DateOnly Vigencia, string Fonte) Identificar(DateOnly data)
    {
        var dados = Selecionar(data);
        return (dados.Norma, dados.Vigencia, dados.Fonte);
    }
    private Dados Selecionar(DateOnly data) => versoes.LastOrDefault(v => v.Vigencia <= data)
        ?? throw new FalhaFrete(400, "dataReferencia", "Não há tabela ANTT cadastrada para essa data. A primeira vigência disponível é 30/09/2026.");

    public CoeficientesFrete Coeficientes(EntradaFrete entrada)
    {
        var dados = Selecionar(entrada.DataReferencia);
        string tabela = (entrada.Contratacao, entrada.AltoDesempenho) switch { ("composicao", false) => "A", ("tracao", false) => "B", ("composicao", true) => "C", ("tracao", true) => "D", _ => throw new FalhaFrete(400, "contratacao", "Contratação inválida.") };
        int eixo = dados.Eixos.LastOrDefault(e => e <= entrada.Eixos, dados.Eixos[0]);
        var linha = dados.Tabelas[tabela].SingleOrDefault(l => l.TipoCarga == entrada.TipoCarga)
            ?? throw new FalhaFrete(400, "tipoCarga", "Tipo de carga inválido.");
        int indice = Array.IndexOf(dados.Eixos, eixo);
        if (linha.Ccd[indice] is not decimal ccd || linha.Cc[indice] is not decimal cc)
            throw new FalhaFrete(400, "eixos", "Não há coeficientes para esta combinação de carga, eixos e contratação.");
        return new(tabela, eixo, ccd, cc);
    }
    public static bool ExigeRetorno(EntradaFrete entrada) => entrada.RetornoComNovaCarga != true && (entrada.TipoCarga is 4 or 10 || entrada.RetornoEspecial);
    public static PisoFrete Calcular(CoeficientesFrete coeficientes, decimal idaKm, decimal retornoKm)
    {
        if (idaKm <= 0 || retornoKm < 0) throw new ArgumentOutOfRangeException(nameof(idaKm));
        var ida = decimal.Round(idaKm * coeficientes.Ccd + coeficientes.Cc, 2, MidpointRounding.AwayFromZero);
        var retorno = decimal.Round(0.92m * coeficientes.Ccd * retornoKm, 2, MidpointRounding.AwayFromZero);
        return new(ida, retorno, ida + retorno);
    }
}
