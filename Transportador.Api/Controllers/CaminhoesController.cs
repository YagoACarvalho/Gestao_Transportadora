using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CaminhoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CaminhoesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Caminhao>>> Listar(
        [FromQuery] bool incluirInativos = false
    )
    {
        IQueryable<Caminhao> consulta = _context.Caminhoes
            .AsNoTracking();

        if (!incluirInativos)
        {
            consulta = consulta.Where(c => c.Ativo);
        }

        List<Caminhao> caminhoes = await consulta
            .OrderBy(c => c.Placa)
            .ToListAsync();

        return Ok(caminhoes);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Caminhao>> ObterPorId(Guid id)
    {
        Caminhao? caminhao = await _context.Caminhoes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (caminhao is null)
        {
            return NotFound();
        }

        return Ok(caminhao);
    }

    [HttpPost]
    public async Task<ActionResult<Caminhao>> Cadastrar(
        CriarCaminhaoDto dto
    )
    {
        Caminhao caminhao = new()
        {
            Placa = dto.Placa,
            Modelo = dto.Modelo
        };

        _context.Caminhoes.Add(caminhao);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = caminhao.Id },
            caminhao
        );
    }

    [HttpPut("{id:guid}")]
public async Task<IActionResult> Atualizar(
    Guid id,
    AtualizarCaminhaoDto dto
)
{
    Caminhao? caminhao = await _context.Caminhoes
        .FirstOrDefaultAsync(c => c.Id == id);

    if (caminhao is null)
    {
        return NotFound();
    }

    caminhao.Placa = dto.Placa;
    caminhao.Modelo = dto.Modelo;
    caminhao.Ativo = dto.Ativo;

    await _context.SaveChangesAsync();

    return NoContent();
}

[HttpDelete("{id:guid}")]
public async Task<IActionResult> Desativar(Guid id)
{
    Caminhao? caminhao = await _context.Caminhoes
        .FirstOrDefaultAsync(c => c.Id == id);

    if (caminhao is null)
    {
        return NotFound();
    }

    caminhao.Ativo = false;

    await _context.SaveChangesAsync();

    return NoContent();
}
}