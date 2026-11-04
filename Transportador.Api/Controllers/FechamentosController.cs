using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Fechamentos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/fechamentos")]
public sealed class FechamentosController(AppDbContext context) : ControllerBase
{
    [HttpPost("previa")]
    public async Task<ActionResult<PreviaFechamento>> Previa(FiltrosFechamento filtros, CancellationToken ct)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        await ValidarVinculos(filtros, ct);
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var previa = await new ApuradorFechamento(context).Apurar(filtros, ct);
        await transaction.CommitAsync(ct);
        return Ok(previa);
    }

    [HttpPost]
    public async Task<ActionResult<AcertoFechamento>> Salvar(SalvarFechamentoDto dto, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var usuarioId)) return Forbid();
        var filtros = dto.Filtros.Normalizar();
        string titulo = dto.Titulo.Trim();
        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var existente = await context.Fechamentos.AsNoTracking().SingleOrDefaultAsync(f => f.UsuarioId == usuarioId && f.ChaveRequisicao == dto.ChaveRequisicao, ct);
        if (existente is not null)
        {
            var conteudo = JsonFechamento.Ler(existente.ConteudoJson);
            if (existente.Titulo != titulo || !string.Equals(conteudo.VersaoPrevia, dto.VersaoPrevia, StringComparison.OrdinalIgnoreCase) ||
                JsonFechamento.Serializar(conteudo.Filtros) != JsonFechamento.Serializar(filtros))
                return Conflito("Esta chave de requisição já foi usada para outro acerto. Consulte o histórico antes de tentar novamente.");
            await transaction.CommitAsync(ct);
            return CreatedAtAction(nameof(Detalhes), new { id = existente.Id }, Resposta(existente));
        }
        await ValidarVinculos(filtros, ct);
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var previa = await new ApuradorFechamento(context).Apurar(filtros, ct);
        if (!string.Equals(previa.VersaoPrevia, dto.VersaoPrevia, StringComparison.OrdinalIgnoreCase))
            return Conflito("Os lançamentos mudaram desde a consulta. Atualize a prévia e confira os valores antes de salvar.");
        var fechamento = new Fechamento { Titulo = titulo, DataInicial = filtros.DataInicial!.Value, DataFinal = filtros.DataFinal!.Value,
            UsuarioId = usuarioId, ChaveRequisicao = dto.ChaveRequisicao!.Value, ConteudoJson = JsonFechamento.Serializar(previa) };
        context.Fechamentos.Add(fechamento);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return CreatedAtAction(nameof(Detalhes), new { id = fechamento.Id }, Resposta(fechamento));
    }

    [HttpGet]
    public async Task<ActionResult<PaginaFechamentos>> Listar([FromQuery, Range(1, int.MaxValue)] int pagina = 1,
        [FromQuery, Range(1, 100)] int tamanhoPagina = 20, CancellationToken ct = default)
    {
        long deslocamento = ((long)pagina - 1) * tamanhoPagina;
        if (deslocamento > int.MaxValue) { ModelState.AddModelError(nameof(pagina), "Página fora do intervalo permitido."); return ValidationProblem(ModelState); }
        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        int quantidade = await context.Fechamentos.CountAsync(ct);
        var registros = await context.Fechamentos.AsNoTracking().OrderByDescending(f => f.DataCriacao).ThenBy(f => f.Id)
            .Skip((int)deslocamento).Take(tamanhoPagina).ToArrayAsync(ct);
        var itens = registros.Select(f => new ResumoAcerto(f.Id, f.Titulo, f.DataInicial, f.DataFinal, f.DataCriacao, f.UsuarioId, JsonFechamento.Ler(f.ConteudoJson).Totais)).ToArray();
        await transaction.CommitAsync(ct);
        return Ok(new PaginaFechamentos(itens, pagina, tamanhoPagina, quantidade));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AcertoFechamento>> Detalhes(Guid id, CancellationToken ct)
    {
        var fechamento = await context.Fechamentos.AsNoTracking().SingleOrDefaultAsync(f => f.Id == id, ct);
        return fechamento is null ? NotFound() : Ok(Resposta(fechamento));
    }
    private async Task ValidarVinculos(FiltrosFechamento filtros, CancellationToken ct)
    {
        if (filtros.MotoristaId.HasValue && !await context.Motoristas.AnyAsync(m => m.Id == filtros.MotoristaId, ct)) ModelState.AddModelError("motoristaId", "Motorista não encontrado.");
        if (filtros.CaminhaoId.HasValue && !await context.Caminhoes.AnyAsync(c => c.Id == filtros.CaminhaoId, ct)) ModelState.AddModelError("caminhaoId", "Caminhão não encontrado.");
    }
    private static AcertoFechamento Resposta(Fechamento f) => new(f.Id, f.Titulo, f.DataInicial, f.DataFinal, f.DataCriacao, f.UsuarioId, f.VersaoFormato, JsonFechamento.Ler(f.ConteudoJson));
    private static ConflictObjectResult Conflito(string mensagem) => new(new ProblemDetails { Status = 409, Title = mensagem });
}
