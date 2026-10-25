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

    public ViagensController(AppDbContext context) => _context = context;

    private IQueryable<Viagem> Consulta() => _context.Viagens.AsNoTracking()
        .Include(v => v.Motorista).Include(v => v.Caminhao);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Viagem>>> Listar()
        => Ok(await Consulta().OrderByDescending(v => v.DataViagem).ToListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Viagem>> ObterPorId(Guid id)
    {
        var viagem = await Consulta().FirstOrDefaultAsync(v => v.Id == id);
        return viagem is null ? NotFound() : Ok(viagem);
    }

    [HttpPost]
    public async Task<ActionResult<Viagem>> Cadastrar(CriarViagemDto dto)
    {
        await ValidarVinculos(dto);
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        Viagem viagem = new() { Status = "Planejada" };
        AplicarDados(viagem, dto);
        _context.Viagens.Add(viagem);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(ObterPorId), new { id = viagem.Id }, viagem);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarViagemDto dto)
    {
        var viagem = await _context.Viagens.FirstOrDefaultAsync(v => v.Id == id);
        if (viagem is null) return NotFound();
        if (!TransicaoPermitida(viagem.Status, dto.Status))
            ModelState.AddModelError(nameof(dto.Status), "Transição de situação não permitida.");
        bool dadosAlterados = viagem.Origem != dto.Origem || viagem.Destino != dto.Destino ||
            viagem.DataViagem != dto.DataViagem || viagem.MotoristaId != dto.MotoristaId ||
            viagem.CaminhaoId != dto.CaminhaoId || viagem.ValorFrete != dto.ValorFrete;
        if (viagem.Status != "Planejada" && dadosAlterados)
            ModelState.AddModelError("Viagem", "Os dados só podem ser editados enquanto a viagem está planejada.");
        await ValidarVinculos(dto, viagem);
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        AplicarDados(viagem, dto);
        viagem.Status = dto.Status;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Mantem a rota da main remota e aplica as regras aprovadas de cancelamento.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var viagem = await _context.Viagens.FirstOrDefaultAsync(v => v.Id == id);
        if (viagem is null) return NotFound();
        if (!TransicaoPermitida(viagem.Status, "Cancelada"))
        {
            ModelState.AddModelError(nameof(viagem.Status), "Esta viagem não pode ser cancelada nesta situação.");
            return ValidationProblem(ModelState);
        }
        viagem.Status = "Cancelada";
        await _context.SaveChangesAsync();
        return NoContent();
    }
    private async Task ValidarVinculos(CriarViagemDto dto, Viagem? atual = null)
    {
        // Manter um vinculo existente inativo preserva o historico. Nova atribuicao exige ativo.
        if (atual is null || atual.MotoristaId != dto.MotoristaId)
            if (!await _context.Motoristas.AnyAsync(m => m.Id == dto.MotoristaId && m.Ativo))
                ModelState.AddModelError(nameof(dto.MotoristaId), "Selecione um motorista ativo existente.");
        if (atual is null || atual.CaminhaoId != dto.CaminhaoId)
            if (!await _context.Caminhoes.AnyAsync(c => c.Id == dto.CaminhaoId && c.Ativo))
                ModelState.AddModelError(nameof(dto.CaminhaoId), "Selecione um caminhão ativo existente.");
    }

    private static bool TransicaoPermitida(string? atual, string? novo) => atual switch
    {
        "Planejada" => novo is "Planejada" or "Em andamento" or "Cancelada",
        "Em andamento" => novo is "Em andamento" or "Concluída" or "Cancelada",
        "Concluída" => novo == "Concluída",
        "Cancelada" => novo == "Cancelada",
        _ => false,
    };

    private static void AplicarDados(Viagem viagem, CriarViagemDto dto)
    {
        viagem.Origem = dto.Origem; viagem.Destino = dto.Destino;
        viagem.DataViagem = dto.DataViagem; viagem.MotoristaId = dto.MotoristaId;
        viagem.CaminhaoId = dto.CaminhaoId; viagem.ValorFrete = dto.ValorFrete;
    }
}
