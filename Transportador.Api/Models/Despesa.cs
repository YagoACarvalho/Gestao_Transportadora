namespace Transportador.Api.Models;

public class Despesa
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? ViagemId { get; set; }

    public string? Descricao { get; set; }

    public string? Categoria { get; set; }

    public decimal? Valor { get; set; }

    public DateOnly? DataDespesa { get; set; }

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public Viagem? Viagem { get; set; }
}