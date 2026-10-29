using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DespesasController : ControllerBase
{
    private readonly AppDbContext _context;

    public DespesasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Despesa>>> Listar()
    {
        List<Despesa> despesas = await _context.Despesas
            .AsNoTracking()
            .Include(d => d.Viagem)
            .Include(d => d.Caminhao)
            .OrderByDescending(d => d.DataDespesa)
            .ToListAsync();

        return Ok(despesas);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Despesa>> ObterPorId(Guid id)
    {
        Despesa? despesa = await _context.Despesas
            .AsNoTracking()
            .Include(d => d.Viagem)
            .Include(d => d.Caminhao)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (despesa is null)
        {
            return NotFound();
        }

        return Ok(despesa);
    }

    [HttpPost]
    public async Task<ActionResult<Despesa>> Cadastrar(
        CriarDespesaDto dto
    )
    {
        await ValidarViagem(dto.ViagemId);
        await ValidarCaminhao(dto);
        if (dto.ViagemId.HasValue && dto.ConsiderarNoFinanceiro is null &&
            await _context.Viagens.AnyAsync(v => v.Id == dto.ViagemId && v.Status == "Cancelada"))
            ModelState.AddModelError(nameof(dto.ConsiderarNoFinanceiro), "Escolha se esta despesa deve entrar no financeiro da viagem cancelada.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        Despesa despesa = new()
        {
            ViagemId = dto.ViagemId,
            CaminhaoId = dto.CaminhaoId,
            ConsiderarNoFinanceiro = dto.ConsiderarNoFinanceiro ?? true,
            Descricao = dto.Descricao,
            Categoria = dto.Categoria,
            Valor = dto.Valor,
            DataDespesa = dto.DataDespesa
        };

        _context.Despesas.Add(despesa);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = despesa.Id },
            despesa
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarDespesaDto dto
    )
    {
        Despesa? despesa = await _context.Despesas
            .FirstOrDefaultAsync(d => d.Id == id);

        if (despesa is null)
        {
            return NotFound();
        }

        if (despesa.Origem == "RemuneracaoMotorista")
        {
            ModelState.AddModelError("Despesa", "A remuneração automática é calculada pelo frete. Use a alteração de situação financeira para incluir ou desconsiderar.");
            return ValidationProblem(ModelState);
        }
        await ValidarViagem(dto.ViagemId);
        await ValidarCaminhao(dto, despesa.CaminhaoId);
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        despesa.ViagemId = dto.ViagemId;
        despesa.CaminhaoId = dto.CaminhaoId;
        if (dto.ConsiderarNoFinanceiro.HasValue) despesa.ConsiderarNoFinanceiro = dto.ConsiderarNoFinanceiro.Value;
        despesa.Descricao = dto.Descricao;
        despesa.Categoria = dto.Categoria;
        despesa.Valor = dto.Valor;
        despesa.DataDespesa = dto.DataDespesa;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        Despesa? despesa = await _context.Despesas
            .FirstOrDefaultAsync(d => d.Id == id);

        if (despesa is null)
        {
            return NotFound();
        }

        if (despesa.Origem == "RemuneracaoMotorista")
        {
            ModelState.AddModelError("Despesa", "A remuneração automática não pode ser excluída. Altere o frete ou desconsidere o lançamento no financeiro.");
            return ValidationProblem(ModelState);
        }
        _context.Despesas.Remove(despesa);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:guid}/situacao-financeira")]
    public async Task<IActionResult> AlterarSituacaoFinanceira(Guid id, SituacaoFinanceiraDto dto)
    {
        var despesa = await _context.Despesas.FirstOrDefaultAsync(d => d.Id == id);
        if (despesa is null) return NotFound();
        despesa.ConsiderarNoFinanceiro = dto.ConsiderarNoFinanceiro!.Value;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task ValidarCaminhao(CriarDespesaDto dto, Guid? vinculoAtual = null)
    {
        if (!dto.CaminhaoId.HasValue) return;
        if (dto.ViagemId.HasValue)
        {
            ModelState.AddModelError(nameof(dto.CaminhaoId), "Em despesas de viagem, o caminhão é definido pela própria viagem.");
            return;
        }
        if (!await _context.Caminhoes.AnyAsync(c => c.Id == dto.CaminhaoId && (c.Ativo || c.Id == vinculoAtual)))
            ModelState.AddModelError(nameof(dto.CaminhaoId), "Selecione um caminhão ativo existente ou deixe sem vínculo.");
    }

    private async Task ValidarViagem(Guid? viagemId)
    {
        // Despesas podem surgir em qualquer fase, inclusive depois de conclusão/cancelamento.
        if (viagemId.HasValue && !await _context.Viagens.AnyAsync(v => v.Id == viagemId))
            ModelState.AddModelError(nameof(CriarDespesaDto.ViagemId), "Selecione uma viagem existente ou deixe sem vínculo.");
    }
}
