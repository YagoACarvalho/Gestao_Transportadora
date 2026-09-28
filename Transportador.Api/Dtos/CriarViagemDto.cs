namespace Transportador.Api.Dtos;

public class CriarViagemDto
{
    public Guid? MotoristaId { get; set; }

    public Guid? CaminhaoId { get; set; }

    public string? Origem { get; set; }

    public string? Destino { get; set; }

    public DateOnly? DataViagem { get; set; }

    public decimal? ValorFrete { get; set; }

    public string? Status { get; set; }
}