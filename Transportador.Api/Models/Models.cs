namespace Transportador.Api.Models;

public class Viagem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? MotoristaId { get; set; }

    public Guid? CaminhaoId { get; set; }

    public string? Origem { get; set; }

    public string? Destino { get; set; }

    public DateOnly? DataViagem { get; set; }

    public decimal? ValorFrete { get; set; }

    public string? Status { get; set; }

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public Motorista? Motorista { get; set; }

    public Caminhao? Caminhao { get; set; }
}