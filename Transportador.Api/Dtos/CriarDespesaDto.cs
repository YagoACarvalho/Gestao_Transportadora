using System.ComponentModel.DataAnnotations;

namespace Transportador.Api.Dtos;

public class CriarDespesaDto : IValidatableObject
{
    public Guid? ViagemId { get; set; }
    public Guid? CaminhaoId { get; set; }

    public bool? ConsiderarNoFinanceiro { get; set; }

    [Required, StringLength(200)]
    public string? Descricao { get; set; }

    [Required, StringLength(50)]
    public string? Categoria { get; set; }

    [Required]
    public decimal? Valor { get; set; }

    [Required]
    public DateOnly? DataDespesa { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Valor is decimal valor && (valor <= 0 || valor > 9999999999.99m || decimal.Round(valor, 2) != valor))
            yield return new ValidationResult("Informe valor maior que zero, com até duas casas decimais e no máximo 9999999999,99.", [nameof(Valor)]);
    }
}
