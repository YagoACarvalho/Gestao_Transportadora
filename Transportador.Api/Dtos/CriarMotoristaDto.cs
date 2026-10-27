using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class CriarMotoristaDto
{
    [Required(ErrorMessage = "O campo Nome é obrigatório."), StringLength(150)]
    public string Nome { get; set; } = string.Empty;

    private string? _cpf;

    [StringLength(11)]
    public string? Cpf
    {
        get => _cpf;
        set
        {
            var normalizado = new string((value ?? "").Where(c => c != '.' && c != '-' && !char.IsWhiteSpace(c)).ToArray());
            _cpf = normalizado.Length == 0 ? null : normalizado;
        }
    }

    [StringLength(20)]
    public string? NumeroCnh { get; set; }

    [StringLength(5)]
    public string? CategoriaCnh { get; set; }

    public DateOnly? DataValidadeCnh { get; set; }

    [StringLength(20)]
    public string? Telefone { get; set; }
}
