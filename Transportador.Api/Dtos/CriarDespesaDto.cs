namespace Transportador.Api.Dtos;

public class CriarDespesaDto
{
    public Guid? ViagemId { get; set; }

    public string? Descricao { get; set; }

    public string? Categoria { get; set; }

    public decimal? Valor { get; set; }

    public DateOnly? DataDespesa { get; set; }
}