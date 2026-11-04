using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Transportador.Api.Fechamentos;

public sealed class FiltrosFechamento : IValidatableObject
{
    public DateOnly? DataInicial { get; set; }
    public DateOnly? DataFinal { get; set; }
    public Guid? MotoristaId { get; set; }
    public Guid? CaminhaoId { get; set; }
    [MaxLength(5)] public string[]? Situacoes { get; set; } = [];
    [StringLength(50)] public string? Categoria { get; set; }
    [Required] public bool? IncluirDespesasGerais { get; set; }

    public static readonly string[] SituacoesPermitidas = ["Planejada", "Em andamento", "Pausada", "Concluída", "Cancelada"];
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DataInicial.HasValue && DataFinal.HasValue && DataInicial > DataFinal)
            yield return new("A data final deve ser igual ou posterior à inicial.", [nameof(DataFinal)]);
        if (MotoristaId == Guid.Empty || CaminhaoId == Guid.Empty)
            yield return new("Informe um identificador válido para motorista ou caminhão.", [nameof(MotoristaId), nameof(CaminhaoId)]);
        if (Situacoes?.Any(s => s is null || !SituacoesPermitidas.Contains(s)) == true)
            yield return new("Selecione somente situações de viagem válidas.", [nameof(Situacoes)]);
    }
    public FiltrosFechamento Normalizar() => new()
    {
        DataInicial = DataInicial, DataFinal = DataFinal, MotoristaId = MotoristaId, CaminhaoId = CaminhaoId,
        Situacoes = (Situacoes ?? []).Distinct().Order(StringComparer.Ordinal).ToArray(),
        Categoria = string.IsNullOrWhiteSpace(Categoria) ? null : Categoria.Trim(),
        IncluirDespesasGerais = IncluirDespesasGerais
    };
}

public sealed class SalvarFechamentoDto : IValidatableObject
{
    [Required, StringLength(150)] public string Titulo { get; set; } = "";
    [Required] public FiltrosFechamento Filtros { get; set; } = null!;
    [Required, RegularExpression("^[A-Fa-f0-9]{64}$")] public string VersaoPrevia { get; set; } = "";
    [Required] public Guid? ChaveRequisicao { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ChaveRequisicao == Guid.Empty) yield return new("A chave da requisição deve ser um UUID válido.", [nameof(ChaveRequisicao)]);
        if (Filtros is not null && (!Filtros.DataInicial.HasValue || !Filtros.DataFinal.HasValue))
            yield return new("Para salvar o acerto, defina as duas datas do período.", [nameof(Filtros)]);
    }
}

public sealed record ViagemFechamento(Guid Id, DateOnly? DataViagem, string? Origem, string? Destino,
    Guid? MotoristaId, string? MotoristaNome, Guid? CaminhaoId, string? CaminhaoPlaca,
    string? Situacao, decimal? ValorFrete, bool IncluidaNaReceita);
public sealed record DespesaFechamento(Guid Id, DateOnly? DataDespesa, string? Descricao, string? Categoria,
    decimal? Valor, string Origem, Guid? ViagemId, Guid? MotoristaId, string? MotoristaNome,
    Guid? CaminhaoId, string? CaminhaoPlaca, string? SituacaoViagem);
public sealed record TotaisFechamento(decimal TotalFretes, decimal TotalDespesasViagens, decimal TotalDespesasGerais,
    decimal TotalDespesas, decimal TotalRemuneracaoMotoristas, decimal Resultado, int QuantidadeViagens, int QuantidadeDespesas);
public sealed record PreviaFechamento(FiltrosFechamento Filtros, string? MotoristaNome, string? CaminhaoPlaca,
    TotaisFechamento Totais, ViagemFechamento[] Viagens, DespesaFechamento[] Despesas, string[] Avisos, string VersaoPrevia);
public sealed record AcertoFechamento(Guid Id, string Titulo, DateOnly DataInicial, DateOnly DataFinal,
    DateTime DataCriacao, Guid UsuarioId, int VersaoFormato, PreviaFechamento Conteudo);
public sealed record ResumoAcerto(Guid Id, string Titulo, DateOnly DataInicial, DateOnly DataFinal,
    DateTime DataCriacao, Guid UsuarioId, TotaisFechamento Totais);
public sealed record PaginaFechamentos(ResumoAcerto[] Itens, int Pagina, int TamanhoPagina, int QuantidadeTotal);

public static class JsonFechamento
{
    public static readonly JsonSerializerOptions Opcoes = new(JsonSerializerDefaults.Web);
    public static string Serializar<T>(T valor) => JsonSerializer.Serialize(valor, Opcoes);
    public static PreviaFechamento Ler(string json) => JsonSerializer.Deserialize<PreviaFechamento>(json, Opcoes)
        ?? throw new InvalidOperationException("Conteúdo do acerto indisponível.");
}
