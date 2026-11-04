using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;

namespace Transportador.Api.Fechamentos;

// Chamado dentro da transação do controller, tanto na consulta quanto na gravação.
public sealed class ApuradorFechamento(AppDbContext context)
{
    public async Task<PreviaFechamento> Apurar(FiltrosFechamento entrada, CancellationToken ct)
    {
        var filtros = entrada.Normalizar();
        var viagensQuery = context.Viagens.AsNoTracking().AsQueryable();
        var despesasQuery = context.Despesas.AsNoTracking().Where(d => d.ConsiderarNoFinanceiro);
        if (filtros.DataInicial is DateOnly inicio)
        {
            viagensQuery = viagensQuery.Where(v => v.DataViagem.HasValue && v.DataViagem >= inicio);
            despesasQuery = despesasQuery.Where(d => d.DataDespesa.HasValue && d.DataDespesa >= inicio);
        }
        if (filtros.DataFinal is DateOnly fim)
        {
            viagensQuery = viagensQuery.Where(v => v.DataViagem.HasValue && v.DataViagem <= fim);
            despesasQuery = despesasQuery.Where(d => d.DataDespesa.HasValue && d.DataDespesa <= fim);
        }
        if (filtros.MotoristaId is Guid motoristaId)
        {
            viagensQuery = viagensQuery.Where(v => v.MotoristaId == motoristaId);
            despesasQuery = despesasQuery.Where(d => d.Viagem != null && d.Viagem.MotoristaId == motoristaId);
        }
        if (filtros.CaminhaoId is Guid caminhaoId)
        {
            viagensQuery = viagensQuery.Where(v => v.CaminhaoId == caminhaoId);
            despesasQuery = despesasQuery.Where(d => d.Viagem != null ? d.Viagem.CaminhaoId == caminhaoId : d.CaminhaoId == caminhaoId);
        }
        if (filtros.Situacoes is { Length: > 0 } situacoes)
        {
            viagensQuery = viagensQuery.Where(v => situacoes.Contains(v.Status!));
            // Custos gerais não possuem situação; o filtro de situação atua nas viagens.
            despesasQuery = despesasQuery.Where(d => d.Viagem == null || situacoes.Contains(d.Viagem.Status!));
        }
        if (filtros.Categoria is string categoria) despesasQuery = despesasQuery.Where(d => d.Categoria == categoria);
        if (filtros.IncluirDespesasGerais != true) despesasQuery = despesasQuery.Where(d => d.ViagemId != null);

        var viagens = await viagensQuery.OrderBy(v => v.Id).Select(v => new ViagemFechamento(v.Id, v.DataViagem, v.Origem, v.Destino,
            v.MotoristaId, v.Motorista != null ? v.Motorista.Nome : null, v.CaminhaoId, v.Caminhao != null ? v.Caminhao.Placa : null,
            v.Status, v.ValorFrete, v.Status == null || v.Status != "Cancelada")).ToArrayAsync(ct);
        var despesas = await despesasQuery.OrderBy(d => d.Id).Select(d => new DespesaFechamento(d.Id, d.DataDespesa, d.Descricao, d.Categoria,
            d.Valor, d.Origem, d.ViagemId, d.Viagem != null ? d.Viagem.MotoristaId : null,
            d.Viagem != null && d.Viagem.Motorista != null ? d.Viagem.Motorista.Nome : null,
            d.Viagem != null ? d.Viagem.CaminhaoId : d.CaminhaoId,
            d.Viagem != null && d.Viagem.Caminhao != null ? d.Viagem.Caminhao.Placa : d.Caminhao != null ? d.Caminhao.Placa : null,
            d.Viagem != null ? d.Viagem.Status : null)).ToArrayAsync(ct);
        string? motoristaNome = filtros.MotoristaId.HasValue ? await context.Motoristas.AsNoTracking().Where(m => m.Id == filtros.MotoristaId).Select(m => m.Nome).SingleOrDefaultAsync(ct) : null;
        string? caminhaoPlaca = filtros.CaminhaoId.HasValue ? await context.Caminhoes.AsNoTracking().Where(c => c.Id == filtros.CaminhaoId).Select(c => c.Placa).SingleOrDefaultAsync(ct) : null;

        decimal fretes = viagens.Where(v => v.IncluidaNaReceita).Sum(v => v.ValorFrete ?? 0);
        decimal deViagens = despesas.Where(d => d.ViagemId.HasValue).Sum(d => d.Valor ?? 0);
        decimal gerais = despesas.Where(d => !d.ViagemId.HasValue).Sum(d => d.Valor ?? 0);
        decimal remuneracao = despesas.Where(d => d.Origem == "RemuneracaoMotorista").Sum(d => d.Valor ?? 0);
        var totais = new TotaisFechamento(fretes, deViagens, gerais, deViagens + gerais, remuneracao,
            fretes - deViagens - gerais, viagens.Length, despesas.Length);
        List<string> avisos = ["Resultado apurado não confirma recebimento, pagamento ou lucro realizado. A remuneração já integra as despesas."];
        if (filtros.DataInicial.HasValue || filtros.DataFinal.HasValue) avisos.Add("Fretes usam a data da viagem; custos usam a data da despesa. Registros sem data ficam fora deste período.");
        if (filtros.MotoristaId.HasValue) avisos.Add("Despesas gerais não são atribuídas ou rateadas para o motorista.");
        if (filtros.Categoria is not null) avisos.Add("Categoria limita somente os custos: este resultado considera apenas a categoria selecionada, com os fretes dos demais filtros.");
        if (viagens.Any(v => v.ValorFrete is null) || despesas.Any(d => d.Valor is null)) avisos.Add("Há registros sem valor informado: aparecem nos detalhes e contribuem com zero para a soma.");
        var previa = new PreviaFechamento(filtros, motoristaNome, caminhaoPlaca, totais, viagens, despesas, avisos.ToArray(), "");
        return previa with { VersaoPrevia = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonFechamento.Serializar(previa)))) };
    }
}
