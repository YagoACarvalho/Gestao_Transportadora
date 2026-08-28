using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MotoristasController : ControllerBase
{
    private readonly AppDbContext _context;

    public MotoristasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Motorista>> ObterPorId(Guid id)
    {
        Motorista? motorista = await _context.Motoristas
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (motorista is null)
        {
            return NotFound();
        }

        return Ok(motorista);
    }

    [HttpPost]
    public async Task<ActionResult<Motorista>> Cadastrar(
        CriarMotoristaDto dto
    )
    {
        Motorista motorista = new()
        {
            Nome = dto.Nome,
            Cpf = dto.Cpf,
            NumeroCnh = dto.NumeroCnh,
            CategoriaCnh = dto.CategoriaCnh,
            DataValidadeCnh = dto.DataValidadeCnh,
            Telefone = dto.Telefone
        };

        _context.Motoristas.Add(motorista);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = motorista.Id },
            motorista
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarMotoristaDto dto
    )
    {
        Motorista? motorista = await _context.Motoristas
            .FirstOrDefaultAsync(m => m.Id == id);

        if (motorista is null)
        {
            return NotFound();
        }

        motorista.Nome = dto.Nome;
        motorista.Cpf = dto.Cpf;
        motorista.NumeroCnh = dto.NumeroCnh;
        motorista.CategoriaCnh = dto.CategoriaCnh;
        motorista.DataValidadeCnh = dto.DataValidadeCnh;
        motorista.Telefone = dto.Telefone;
        motorista.Ativo = dto.Ativo;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Desativar(Guid id)
    {
        Motorista? motorista = await _context.Motoristas
            .FirstOrDefaultAsync(m => m.Id == id);

        if (motorista is null)
        {
            return NotFound();
        }

        motorista.Ativo = false;

        await _context.SaveChangesAsync();

        return NoContent();
    }

   [HttpGet]
    public async Task<ActionResult<IEnumerable<Motorista>>> Listar(
        [FromQuery] bool incluirInativos = false
    )
    {
        IQueryable<Motorista> consulta = _context.Motoristas
            .AsNoTracking();

        if (!incluirInativos)
        {
            consulta = consulta.Where(m => m.Ativo);
        }

        List<Motorista> motoristas = await consulta
            .OrderBy(m => m.Nome)
            .ToListAsync();

        return Ok(motoristas);
    }
}

