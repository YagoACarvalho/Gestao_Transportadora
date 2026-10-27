using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Dtos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RelatoriosController : ControllerBase
{
    private readonly AppDbContext _context;

    public RelatoriosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("resumo-financeiro")]
    public async Task<ActionResult<ResumoFinanceiroDto>> ObterResumoFinanceiro(
        [FromQuery] DateOnly? dataInicial,
        [FromQuery] DateOnly? dataFinal
    )
    {
        if (dataInicial.HasValue && dataFinal.HasValue && dataInicial > dataFinal)
        {
            ModelState.AddModelError(nameof(dataFinal), "A data final deve ser igual ou posterior à data inicial.");
            return ValidationProblem(ModelState);
        }

        IQueryable<Viagem> viagens = _context.Viagens
            .AsNoTracking()
            .Where(v => v.Status == null || v.Status != "Cancelada");

        IQueryable<Despesa> despesas = _context.Despesas
            .AsNoTracking().Where(d => d.ConsiderarNoFinanceiro);

        if (dataInicial.HasValue)
        {
            viagens = viagens.Where(
                v => v.DataViagem.HasValue &&
                     v.DataViagem.Value >= dataInicial.Value
            );

            despesas = despesas.Where(
                d => d.DataDespesa.HasValue &&
                     d.DataDespesa.Value >= dataInicial.Value
            );
        }

        if (dataFinal.HasValue)
        {
            viagens = viagens.Where(
                v => v.DataViagem.HasValue &&
                     v.DataViagem.Value <= dataFinal.Value
            );

            despesas = despesas.Where(
                d => d.DataDespesa.HasValue &&
                     d.DataDespesa.Value <= dataFinal.Value
            );
        }

        decimal totalFretes = await viagens
            .SumAsync(v => v.ValorFrete ?? 0);

        decimal totalDespesasViagens = await despesas.Where(d => d.ViagemId != null)
            .SumAsync(d => d.Valor ?? 0);
        decimal totalDespesasGerais = await despesas.Where(d => d.ViagemId == null)
            .SumAsync(d => d.Valor ?? 0);
        decimal totalDespesas = totalDespesasViagens + totalDespesasGerais;
        decimal totalRemuneracaoMotoristas = await despesas.Where(d => d.Origem == "RemuneracaoMotorista").SumAsync(d => d.Valor ?? 0);

        ResumoFinanceiroDto resumo = new()
        {
            DataInicial = dataInicial,
            DataFinal = dataFinal,
            TotalFretes = totalFretes,
            TotalDespesas = totalDespesas,
            TotalDespesasViagens = totalDespesasViagens,
            TotalDespesasGerais = totalDespesasGerais,
            TotalRemuneracaoMotoristas = totalRemuneracaoMotoristas,
            Lucro = totalFretes - totalDespesas
        };

        return Ok(resumo);
    }
}
