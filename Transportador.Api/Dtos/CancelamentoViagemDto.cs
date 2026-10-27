using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class CancelamentoViagemDto
{
    [Required]
    public string? VersaoDespesas { get; set; }

    public bool? ManterDespesas { get; set; }
}

public record ResumoCancelamentoDto(int QuantidadeDespesas, decimal TotalDespesas, string VersaoDespesas);
