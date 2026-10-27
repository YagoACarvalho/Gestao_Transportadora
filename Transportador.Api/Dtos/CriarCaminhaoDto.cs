using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class CriarCaminhaoDto
{
    [Required, StringLength(10)]
    public string Placa { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string Modelo { get; set; } = string.Empty;
}
