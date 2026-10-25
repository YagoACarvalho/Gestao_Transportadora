using System.ComponentModel.DataAnnotations;
using Transportador.Api.Dtos;
using Xunit;

namespace Transportador.Api.Tests.Motoristas;

public class CriarMotoristaDtoTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validacao_NomeAusenteVazioOuEspacos_RejeitaNome(string? nome)
    {
        CriarMotoristaDto dto = new() { Nome = nome! };
        List<ValidationResult> erros = [];

        bool valido = Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true);

        Assert.False(valido);
        Assert.Contains(erros, erro => erro.MemberNames.Contains(nameof(dto.Nome)));
    }

    [Fact]
    public void Validacao_SomenteNomeInformado_AceitaCamposOpcionaisAusentes()
    {
        CriarMotoristaDto dto = new() { Nome = "Motorista de teste" };
        List<ValidationResult> erros = [];

        Assert.True(Validator.TryValidateObject(dto, new ValidationContext(dto), erros, true));
        Assert.Empty(erros);
    }
}
