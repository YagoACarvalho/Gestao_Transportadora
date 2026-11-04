namespace Transportador.Api.Models;

public class Fechamento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titulo { get; set; } = "";
    public DateOnly DataInicial { get; set; }
    public DateOnly DataFinal { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public Guid UsuarioId { get; set; }
    public Guid ChaveRequisicao { get; set; }
    public int VersaoFormato { get; set; } = 1;
    public string ConteudoJson { get; set; } = "";
}
