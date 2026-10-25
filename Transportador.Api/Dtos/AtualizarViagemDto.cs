using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class AtualizarViagemDto : CriarViagemDto
{
    [Required, StringLength(50)]
    public string Status { get; set; } = string.Empty;
}
