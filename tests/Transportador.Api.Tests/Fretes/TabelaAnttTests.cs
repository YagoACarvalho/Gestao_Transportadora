using Transportador.Api.Fretes;
using Xunit;

namespace Transportador.Api.Tests.Fretes;

public sealed class TabelaAnttTests
{
    private readonly TabelaAntt tabela = new();
    [Fact]
    public void ReproduzExemploConhecidoComTracaoQuatroEixos()
    {
        var coef = tabela.Coeficientes(new() { Contratacao = "tracao", Eixos = 4, TipoCarga = 5, DataReferencia = new(2026, 10, 1) });
        Assert.Equal(new CoeficientesFrete("B", 4, 5.3538m, 533.40m), coef);
        var piso = TabelaAntt.Calcular(coef, 200, 200);
        Assert.Equal(1604.16m, piso.PisoIda);
        Assert.Equal(985.10m, piso.RetornoVazio);
        Assert.Equal(2589.26m, piso.PisoTotal);
    }
    [Theory]
    [InlineData("composicao", false, "A", "5.9180", "588.86")]
    [InlineData("tracao", false, "B", "5.3538", "533.40")]
    [InlineData("composicao", true, "C", "5.0693", "213.27")]
    [InlineData("tracao", true, "D", "4.6343", "201.32")]
    public void SelecionaQuatroTabelas(string contratacao, bool alto, string letra, string ccd, string cc)
    {
        var c = tabela.Coeficientes(new() { Contratacao = contratacao, AltoDesempenho = alto, Eixos = 4, DataReferencia = new(2026, 9, 30) });
        Assert.Equal(letra, c.Tabela);
        Assert.Equal(decimal.Parse(ccd, System.Globalization.CultureInfo.InvariantCulture), c.Ccd);
        Assert.Equal(decimal.Parse(cc, System.Globalization.CultureInfo.InvariantCulture), c.Cc);
    }
    [Fact]
    public void OitoEixosUsaSeteSemPularCelulaVazia()
    {
        Assert.Equal(7, tabela.Coeficientes(new() { Eixos = 8, DataReferencia = new(2026, 10, 1) }).EixosReferencia);
        var erro = Assert.Throws<FalhaFrete>(() => tabela.Coeficientes(new() { Eixos = 8, TipoCarga = 12, DataReferencia = new(2026, 10, 1) }));
        Assert.Equal(400, erro.Status);
    }
    [Fact]
    public void RecusaDataAnteriorAPrimeiraTabela() => Assert.Throws<FalhaFrete>(() => tabela.Identificar(new(2026, 9, 29)));
    [Fact]
    public void ArredondaMeioCentavoParaCima() => Assert.Equal(1.01m, TabelaAntt.Calcular(new("A", 2, 1m, .005m), 1, 0).PisoIda);
    [Theory]
    [InlineData(4, false, true)] [InlineData(10, false, true)] [InlineData(5, false, false)] [InlineData(5, true, true)]
    public void IncluiRetornoPorEnquadramento(int carga, bool especial, bool esperado) => Assert.Equal(esperado, TabelaAntt.ExigeRetorno(new() { TipoCarga = carga, RetornoEspecial = especial }));
    [Theory]
    [InlineData(4, false)] [InlineData(10, false)] [InlineData(5, true)]
    public void NovaOperacaoNaVoltaNaoAcrescentaRetornoVazio(int carga, bool especial) =>
        Assert.False(TabelaAntt.ExigeRetorno(new() { TipoCarga = carga, RetornoEspecial = especial, RetornoComNovaCarga = true }));
    [Fact]
    public void CargaGeralSeisEixos500KmConfereComPortaria22()
    {
        var c = tabela.Coeficientes(new() { Eixos = 6, TipoCarga = 5, DataReferencia = new(2026, 11, 21) });
        Assert.Equal(new CoeficientesFrete("A", 6, 7.5347m, 671.93m), c);
        Assert.Equal(new PisoFrete(4439.28m, 0, 4439.28m), TabelaAntt.Calcular(c, 500, 0));
    }
    [Fact]
    public void TrechosSomamExatamenteADistanciaOficial()
    {
        var trechos = MapasOrs.AjustarTrechos(123.4567m, [10, 20, 30]);
        Assert.Equal(123.4567m, trechos.Sum());
        Assert.All(trechos, t => Assert.True(t > 0));
    }
}
