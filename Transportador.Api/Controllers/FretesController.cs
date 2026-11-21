using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using Transportador.Api.Fretes;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/fretes")]
public sealed class FretesController(TabelaAntt tabela, IMapasFrete mapas, ClienteMapas cliente, [FromKeyedServices("FretesTiles")] IMemoryCache cache) : ControllerBase
{
    [HttpGet("opcoes")]
    public IActionResult Opcoes() => Ok(new { tiposCarga = TabelaAntt.TiposCarga.Select((nome, i) => new { id = i + 1, nome }), hoje = CalendarioFrete.Hoje(), mapasConfigurados = mapas.Configurado, primeiraVigencia = new DateOnly(2026, 9, 30) });

    [HttpGet("sugestoes")]
    [EnableRateLimiting("fretes-sugestoes")]
    public async Task<IActionResult> Sugestoes([FromQuery, Required, StringLength(250, MinimumLength = 4)] string texto, CancellationToken ct)
    {
        try { return Ok(await mapas.Sugerir(texto, ct)); }
        catch (FalhaFrete e) { return Falha(e); }
    }

    [HttpPost("calcular")]
    [EnableRateLimiting("fretes-calcular")]
    [RequestSizeLimit(16384)]
    public async Task<IActionResult> Calcular(EntradaFrete entrada, CancellationToken ct)
    {
        try
        {
            if (!mapas.Configurado) throw new FalhaFrete(503, "mapas", "O serviço de rotas ainda não foi configurado.");
            var coeficientes = tabela.Coeficientes(entrada);
            var norma = tabela.Identificar(entrada.DataReferencia);
            List<EnderecoFrete> enderecos = [];
            foreach (var endereco in new[] { entrada.Origem }.Concat(entrada.Paradas).Append(entrada.Destino))
                enderecos.Add(await mapas.Localizar(endereco, ct));
            var ida = await mapas.Rota(enderecos.ToArray(), entrada, ct);
            var exigeRetorno = TabelaAntt.ExigeRetorno(entrada);
            RotaFrete? retorno = exigeRetorno && entrada.DistanciaRetornoContratadaKm is null ? await mapas.Rota([enderecos[^1], enderecos[0]], entrada, ct) : null;
            var distanciaIda = entrada.DistanciaContratadaKm ?? ida.DistanciaKm;
            var distanciaRetorno = exigeRetorno ? entrada.DistanciaRetornoContratadaKm ?? retorno!.DistanciaKm : 0;
            var piso = TabelaAntt.Calcular(coeficientes, distanciaIda, distanciaRetorno);
            List<string> avisos = ["Confira os endereços encontrados, as restrições do veículo e as condições reais da via antes de contratar."];
            if (entrada.Pedagio is null) avisos.Add("Pedágio pendente: o total e o preço sugerido são parciais até informar o valor.");
            if (coeficientes.EixosReferencia != entrada.Eixos) avisos.Add($"Utilizada a referência de {coeficientes.EixosReferencia} eixos, imediatamente inferior à informada.");
            if (entrada.AltoDesempenho) avisos.Add("Alto desempenho exige enquadramento e comprovação conforme a Resolução ANTT 5.867/2020.");
            if (entrada.DistanciaContratadaKm.HasValue) avisos.Add("Piso de ida calculado pela distância contratada informada. Os trechos e o mapa são apenas a referência estimada da rota.");
            if (entrada.DistanciaRetornoContratadaKm.HasValue) avisos.Add("Retorno vazio calculado pela distância contratada informada, sem traçado de retorno no mapa.");
            if (entrada.RetornoComNovaCarga == true) avisos.Add("A volta com nova carga é outra operação: seu piso, pedágio e custos devem ser calculados separadamente. Não foi acrescido retorno vazio nesta operação.");
            else if (entrada.RetornoComNovaCarga is null && exigeRetorno) avisos.Add("Retorno não confirmado na entrada antiga: mantida a hipótese de retorno vazio. Confirme se existe nova contratação de carga na volta antes de usar o resultado.");
            if (exigeRetorno && entrada.DistanciaRetornoContratadaKm is null) avisos.Add("Retorno estimado da entrega até a coleta. Confira se a distância corresponde ao retorno fixado em contrato.");
            return Ok(new ResultadoFrete(enderecos.ToArray(), distanciaIda, distanciaRetorno, ida.TrechosKm, ida.Trajeto, retorno?.Trajeto ?? [], coeficientes,
                piso.PisoIda, piso.RetornoVazio, piso.PisoTotal, entrada.Pedagio, entrada.Adicionais, piso.PisoTotal + (entrada.Pedagio ?? 0) + entrada.Adicionais,
                norma.Norma, norma.Vigencia, norma.Fonte, avisos.ToArray()));
        }
        catch (FalhaFrete e) { return Falha(e); }
    }

    // Proxy autenticado: o navegador busca cada imagem com o mesmo token da API.
    [HttpGet("mapa-tiles/{z:int}/{x:int}/{y:int}")]
    [EnableRateLimiting("fretes-tiles")]
    public async Task<IActionResult> Tile(int z, int x, int y, CancellationToken ct)
    {
        try
        {
            string key = $"fretes:tile:{z}:{x}:{y}";
            if (!cache.TryGetValue(key, out byte[]? bytes))
            {
                bytes = await cliente.Tile(z, x, y, ct);
                cache.Set(key, bytes, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7), Size = bytes.Length });
            }
            return File(bytes!, "image/png");
        }
        catch (FalhaFrete e) { return Falha(e); }
    }
    private ObjectResult Falha(FalhaFrete e) => new(new ValidationProblemDetails(new Dictionary<string, string[]> { [e.Campo] = [e.Message] }) { Status = e.Status, Title = e.Message }) { StatusCode = e.Status };
}
