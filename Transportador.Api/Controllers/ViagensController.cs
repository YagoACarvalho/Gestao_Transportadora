using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ViagensController : ControllerBase
{
    private readonly AppDbContext _context;

    public ViagensController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Viagem>>> Listar()
    {
        List<Viagem> viagens = await _context.Viagens
            .AsNoTracking()
            .Include(v => v.Motorista)
            .Include(v => v.Caminhao)
            .OrderByDescending(v => v.DataViagem)
            .ToListAsync();

        return Ok(viagens);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Viagem>> ObterPorId(Guid id)
    {
        Viagem? viagem = await _context.Viagens
            .AsNoTracking()
            .Include(v => v.Motorista)
            .Include(v => v.Caminhao)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (viagem is null)
        {
            return NotFound();
        }

        return Ok(viagem);
    }

    [HttpPost]
    public async Task<ActionResult<Viagem>> Cadastrar(
        CriarViagemDto dto
    )
    {
        Viagem viagem = new()
        {
            MotoristaId = dto.MotoristaId,
            CaminhaoId = dto.CaminhaoId,
            Origem = dto.Origem,
            Destino = dto.Destino,
            DataViagem = dto.DataViagem,
            ValorFrete = dto.ValorFrete,
            Status = dto.Status
        };

        _context.Viagens.Add(viagem);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = viagem.Id },
            viagem
        );
    }

    [HttpPut("{id:guid}")]
public async Task<IActionResult> Atualizar(
    Guid id,
    AtualizarViagemDto dto
    )
    {
    Viagem? viagem = await _context.Viagens
        .FirstOrDefaultAsync(v => v.Id == id);

    if (viagem is null)
    {
        return NotFound();
    }

    viagem.MotoristaId = dto.MotoristaId;
    viagem.CaminhaoId = dto.CaminhaoId;
    viagem.Origem = dto.Origem;
    viagem.Destino = dto.Destino;
    viagem.DataViagem = dto.DataViagem;
    viagem.ValorFrete = dto.ValorFrete;
    viagem.Status = dto.Status;

    await _context.SaveChangesAsync();

    return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
    Viagem? viagem = await _context.Viagens
        .FirstOrDefaultAsync(v => v.Id == id);

    if (viagem is null)
    {
        return NotFound();
    }

    viagem.Status = "Cancelada";

    await _context.SaveChangesAsync();

    return NoContent();
    }
}