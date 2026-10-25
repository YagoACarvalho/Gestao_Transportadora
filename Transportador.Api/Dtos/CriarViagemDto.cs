using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class CriarViagemDto : IValidatableObject
{
    [Required, StringLength(150)]
    public string Origem { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string Destino { get; set; } = string.Empty;

    [Required]
    public DateOnly? DataViagem { get; set; }

    [Required]
    public Guid? MotoristaId { get; set; }

    [Required]
    public Guid? CaminhaoId { get; set; }

    public decimal? ValorFrete { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // Limite do mapeamento numeric(12,2), sem arredondamento silencioso.
        if (ValorFrete is decimal valor && (valor < 0 || valor > 9999999999.99m || decimal.Round(valor, 2) != valor))
            yield return new ValidationResult("Informe frete não negativo, com até duas casas decimais e no máximo 9999999999,99.", [nameof(ValorFrete)]);
    }
}
