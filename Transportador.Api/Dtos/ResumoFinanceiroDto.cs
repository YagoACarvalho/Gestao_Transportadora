namespace Transportador.Api.Dtos;

public class ResumoFinanceiroDto
{
    public DateOnly? DataInicial { get; set; }

    public DateOnly? DataFinal { get; set; }

    public decimal TotalFretes { get; set; }

    public decimal TotalDespesas { get; set; }

    public decimal Lucro { get; set; }
}