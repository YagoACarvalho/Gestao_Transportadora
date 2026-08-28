namespace Transportador.Api.Models;

public class Caminhao
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Placa { get; set; } = string.Empty;

    public string Modelo { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
}