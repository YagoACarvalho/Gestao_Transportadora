using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using System.Security.Cryptography;
using System.Text.Json;

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
        Viagem viagem = new() { Status = "Planejada", GerarRemuneracaoAutomatica = true };
        AplicarDados(viagem, dto);
        _context.Viagens.Add(viagem);
        await SincronizarRemuneracao(viagem);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(ObterPorId), new { id = viagem.Id }, viagem);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarViagemDto dto)
    {
        var viagem = await _context.Viagens.FirstOrDefaultAsync(v => v.Id == id);
        if (viagem is null) return NotFound();
        if (dto.Status == "Cancelada" && viagem.Status != "Cancelada" && await _context.Despesas.AnyAsync(d => d.ViagemId == id))
            ModelState.AddModelError("Despesas", "Use a confirmação de cancelamento para escolher o tratamento das despesas.");
        if (!TransicaoPermitida(viagem.Status, dto.Status))
            ModelState.AddModelError(nameof(dto.Status), "Transição de situação não permitida.");
        bool dadosAlterados = viagem.Origem != dto.Origem || viagem.Destino != dto.Destino ||
            viagem.DataViagem != dto.DataViagem || viagem.MotoristaId != dto.MotoristaId ||
            viagem.CaminhaoId != dto.CaminhaoId || viagem.ValorFrete != dto.ValorFrete;
        bool regularizando = string.IsNullOrWhiteSpace(viagem.Status) && dto.Status == "Planejada";
        bool reabrindo = (viagem.Status is "Concluída" or "Cancelada") && dto.Status == "Planejada";
        if (viagem.Status != "Planejada" && !regularizando && dadosAlterados)
            ModelState.AddModelError("Viagem", "Os dados só podem ser editados enquanto a viagem está planejada.");
        await ValidarVinculos(dto, viagem);
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        AplicarDados(viagem, dto);
        viagem.Status = dto.Status;
        if (!regularizando && !reabrindo) await SincronizarRemuneracao(viagem);
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
        if (viagem.Status != "Cancelada" && await _context.Despesas.AnyAsync(d => d.ViagemId == id))
        {
            ModelState.AddModelError("Despesas", "Use a confirmação de cancelamento para escolher o tratamento das despesas.");
            return ValidationProblem(ModelState);
        }
        viagem.Status = "Cancelada";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/cancelamento")]
    public async Task<ActionResult<ResumoCancelamentoDto>> PrepararCancelamento(Guid id)
    {
        var viagem = await _context.Viagens.AsNoTracking().FirstOrDefaultAsync(v => v.Id == id);
        if (viagem is null) return NotFound();
        var despesas = await _context.Despesas.AsNoTracking().Where(d => d.ViagemId == id).OrderBy(d => d.Id).ToListAsync();
        return Ok(new ResumoCancelamentoDto(despesas.Count, despesas.Sum(d => d.Valor ?? 0), Versao(viagem, despesas)));
    }

    [HttpPost("{id:guid}/cancelamento")]
    public async Task<IActionResult> ConfirmarCancelamento(Guid id, CancelamentoViagemDto dto)
    {
        var viagem = await _context.Viagens.FirstOrDefaultAsync(v => v.Id == id);
        if (viagem is null) return NotFound();
        // Repetição não reaplica a decisão sobre lançamentos posteriores.
        if (viagem.Status == "Cancelada") return NoContent();
        if (!TransicaoPermitida(viagem.Status, "Cancelada"))
        {
            ModelState.AddModelError("Status", "Esta viagem não pode ser cancelada nesta situação.");
            return ValidationProblem(ModelState);
        }
        var despesas = await _context.Despesas.Where(d => d.ViagemId == id).OrderBy(d => d.Id).ToListAsync();
        if (dto.VersaoDespesas != Versao(viagem, despesas))
            return Conflict(new ProblemDetails { Status = 409, Title = "A viagem ou suas despesas mudaram. Revise o cancelamento." });
        if (despesas.Count > 0 && dto.ManterDespesas is null)
        {
            ModelState.AddModelError(nameof(dto.ManterDespesas), "Escolha se deseja manter ou desconsiderar as despesas.");
            return ValidationProblem(ModelState);
        }
        foreach (var despesa in despesas) despesa.ConsiderarNoFinanceiro = dto.ManterDespesas!.Value;
        viagem.Status = "Cancelada";
        // O filtro global envolve POST e SaveChanges em uma transação Serializable.
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string Versao(Viagem viagem, List<Despesa> despesas) => Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(new
    {
        viagem.Id, viagem.Status, viagem.Origem, viagem.Destino, viagem.DataViagem,
        viagem.MotoristaId, viagem.CaminhaoId, viagem.ValorFrete, viagem.DataCadastro, viagem.GerarRemuneracaoAutomatica,
        Despesas = despesas.Select(d => new { d.Id, d.ViagemId, d.Descricao, d.Categoria, d.Valor, d.DataDespesa, d.DataCadastro, d.ConsiderarNoFinanceiro, d.Origem })
    })));

    private async Task SincronizarRemuneracao(Viagem viagem)
    {
        if (!viagem.GerarRemuneracaoAutomatica) return;
        decimal valor = decimal.Round((viagem.ValorFrete ?? 0m) * 0.15m, 2, MidpointRounding.AwayFromZero);
        var despesa = await _context.Despesas.SingleOrDefaultAsync(d => d.ViagemId == viagem.Id && d.Origem == "RemuneracaoMotorista");
        if (despesa is null)
        {
            if (valor <= 0) return;
            despesa = new Despesa { Viagem = viagem, Origem = "RemuneracaoMotorista",
                Descricao = "Remuneração do motorista — 15%", Categoria = "Remuneração do motorista" };
            _context.Despesas.Add(despesa);
        }
        // Preserva o lançamento e sua inclusão financeira, inclusive quando o frete vira zero.
        despesa.Valor = valor;
        despesa.DataDespesa = viagem.DataViagem;
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
        "Em andamento" => novo is "Em andamento" or "Pausada" or "Concluída" or "Cancelada",
        "Pausada" => novo is "Pausada" or "Em andamento" or "Cancelada",
        "Concluída" => novo is "Concluída" or "Planejada",
        "Cancelada" => novo is "Cancelada" or "Planejada",
        _ => string.IsNullOrWhiteSpace(atual) && novo == "Planejada",
    };

    private static void AplicarDados(Viagem viagem, CriarViagemDto dto)
    {
        viagem.Origem = dto.Origem; viagem.Destino = dto.Destino;
        viagem.DataViagem = dto.DataViagem; viagem.MotoristaId = dto.MotoristaId;
        viagem.CaminhaoId = dto.CaminhaoId; viagem.ValorFrete = dto.ValorFrete;
    }
}
