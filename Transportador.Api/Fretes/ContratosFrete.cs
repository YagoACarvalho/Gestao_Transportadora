using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Fretes;

public sealed record PontoFrete(
    [Range(-34.5, 5.5)] double Lat,
    [Range(-74.5, -28.5)] double Lon);

public sealed record EnderecoFrete(
    [Required, StringLength(250, MinimumLength = 4)] string Texto,
    PontoFrete? Ponto = null);

public sealed class EntradaFrete : IValidatableObject
{
    [Required] public EnderecoFrete Origem { get; set; } = null!;
    [Required] public EnderecoFrete Destino { get; set; } = null!;
    [Required, MaxLength(5)] public List<EnderecoFrete> Paradas { get; set; } = [];
    [Range(1, 12)] public int TipoCarga { get; set; } = 5;
    [Range(2, 20)] public int Eixos { get; set; } = 6;
    [Required, RegularExpression("^(composicao|tracao)$")] public string Contratacao { get; set; } = "composicao";
    public bool AltoDesempenho { get; set; }
    public bool RetornoEspecial { get; set; }
    public bool? RetornoComNovaCarga { get; set; }
    [Range(typeof(decimal), "0.001", "50000", ParseLimitsInInvariantCulture = true)] public decimal? DistanciaContratadaKm { get; set; }
    [Range(typeof(decimal), "0.001", "50000", ParseLimitsInInvariantCulture = true)] public decimal? DistanciaRetornoContratadaKm { get; set; }
    public DateOnly DataReferencia { get; set; }
    [Range(typeof(decimal), "0.1", "6", ParseLimitsInInvariantCulture = true)] public decimal? Altura { get; set; }
    [Range(typeof(decimal), "0.1", "4", ParseLimitsInInvariantCulture = true)] public decimal? Largura { get; set; }
    [Range(typeof(decimal), "0.1", "40", ParseLimitsInInvariantCulture = true)] public decimal? Comprimento { get; set; }
    [Range(typeof(decimal), "0.1", "100", ParseLimitsInInvariantCulture = true)] public decimal? Peso { get; set; }
    [Range(typeof(decimal), "0", "1000000", ParseLimitsInInvariantCulture = true)] public decimal? Pedagio { get; set; }
    [Range(typeof(decimal), "0", "1000000", ParseLimitsInInvariantCulture = true)] public decimal Adicionais { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DataReferencia == default || DataReferencia > CalendarioFrete.Hoje())
            yield return new("Informe uma data de referência válida, até hoje.", [nameof(DataReferencia)]);
        if (Paradas?.Any(p => p is null) == true)
            yield return new("Preencha todas as paradas.", [nameof(Paradas)]);
        if (Pedagio is decimal p && decimal.Round(p, 2) != p)
            yield return new("Use até duas casas decimais.", [nameof(Pedagio)]);
        if (decimal.Round(Adicionais, 2) != Adicionais)
            yield return new("Use até duas casas decimais.", [nameof(Adicionais)]);
        if (DistanciaRetornoContratadaKm.HasValue && !TabelaAntt.ExigeRetorno(this))
            yield return new("Informe distância de retorno apenas quando houver retorno vazio obrigatório nesta operação.", [nameof(DistanciaRetornoContratadaKm)]);
    }
}

public static class CalendarioFrete
{
    public static DateOnly Hoje() => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTimeOffset.UtcNow, "America/Sao_Paulo").DateTime);
}

public sealed record CoeficientesFrete(string Tabela, int EixosReferencia, decimal Ccd, decimal Cc);
public sealed record PisoFrete(decimal PisoIda, decimal RetornoVazio, decimal PisoTotal);
public sealed record RotaFrete(decimal DistanciaKm, decimal[] TrechosKm, PontoFrete[] Trajeto);
public sealed record ResultadoFrete(
    EnderecoFrete[] Enderecos, decimal DistanciaKm, decimal DistanciaRetornoKm,
    decimal[] TrechosKm, PontoFrete[] TrajetoIda, PontoFrete[] TrajetoRetorno,
    CoeficientesFrete Coeficientes, decimal PisoIda, decimal RetornoVazio, decimal PisoTotal,
    decimal? Pedagio, decimal Adicionais, decimal TotalOperacao,
    string Norma, DateOnly Vigencia, string Fonte, string[] Avisos);

public sealed class FalhaFrete(int status, string campo, string mensagem) : Exception(mensagem)
{
    public int Status { get; } = status;
    public string Campo { get; } = campo;
}
