namespace Transportador.Api.Models;

public class Motorista
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? NumeroCnh { get; set; }
    public string? CategoriaCnh { get; set; }
    public DateOnly? DataValidadeCnh { get; set; }
    public string? Telefone { get; set; }
    public bool Ativo { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
}