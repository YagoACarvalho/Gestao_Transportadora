using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class SituacaoFinanceiraDto
{
    [Required]
    public bool? ConsiderarNoFinanceiro { get; set; }
}
