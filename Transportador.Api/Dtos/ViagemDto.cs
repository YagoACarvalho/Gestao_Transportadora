namespace Transportador.Api.Dtos;

// Resposta plana, mantendo nulos de cadastros anteriores sem expor entidades completas.
public class ViagemDto
{
    public Guid Id { get; init; }
    public Guid? MotoristaId { get; init; }
    public string? MotoristaNome { get; init; }
    public bool? MotoristaAtivo { get; init; }
    public Guid? CaminhaoId { get; init; }
    public string? CaminhaoPlaca { get; init; }
    public bool? CaminhaoAtivo { get; init; }
    public string? Origem { get; init; }
    public string? Destino { get; init; }
    public DateOnly? DataViagem { get; init; }
    public decimal? ValorFrete { get; init; }
    public string? Status { get; init; }
    public DateTime DataCadastro { get; init; }
}
