namespace Transportador.Api.Dtos;

public class AtualizarCaminhaoDto
{
    public string Placa { get; set; } = string.Empty;

    public string Modelo { get; set; } = string.Empty;

    public bool Ativo { get; set; }
}