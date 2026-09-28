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
        Despesa despesa = new()
        {
            ViagemId = dto.ViagemId,
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

        despesa.ViagemId = dto.ViagemId;
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

        _context.Despesas.Remove(despesa);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}