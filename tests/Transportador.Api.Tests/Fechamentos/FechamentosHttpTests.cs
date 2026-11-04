using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Transportador.Api.Data;
using Transportador.Api.Fechamentos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Fechamentos;

public sealed class FechamentosHttpTests
{
    private sealed record Dados(Guid Motorista, Guid OutroMotorista, Guid Caminhao, Guid OutroCaminhao, Guid Viagem, Guid Despesa);
    private static FiltrosFechamento Filtros() => new() { DataInicial = new(2026, 10, 1), DataFinal = new(2026, 10, 31), IncluirDespesasGerais = true };
    private static async Task<Dados> Preparar(ApiFactory factory)
    {
        using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var m = new Motorista { Nome = "Motorista original", Ativo = false }; var outro = new Motorista { Nome = "Outro motorista", Ativo = true };
        var c = new Caminhao { Placa = "ABC1234", Modelo = "Caminhão original", Ativo = false }; var outroC = new Caminhao { Placa = "DEF5678", Modelo = "Outro caminhão", Ativo = true };
        var v = new Viagem { Motorista = m, Caminhao = c, DataViagem = new(2026, 10, 10), Origem = "Coleta", Destino = "Entrega", Status = "Concluída", ValorFrete = 1000 };
        var cancelada = new Viagem { Motorista = outro, Caminhao = outroC, DataViagem = new(2026, 10, 11), Status = "Cancelada", ValorFrete = 500 };
        var antiga = new Viagem { Motorista = m, Caminhao = c, DataViagem = new(2026, 9, 1), Status = "Concluída", ValorFrete = 300 };
        var legado = new Viagem { Motorista = outro, Caminhao = outroC, ValorFrete = 100 };
        var diesel = new Despesa { Viagem = v, DataDespesa = new(2026, 10, 10), Valor = 100, Descricao = "Abastecimento", Categoria = "Combustível" };
        db.AddRange(m, outro, c, outroC, v, cancelada, antiga, legado, diesel);
        db.Despesas.AddRange(
            new() { Viagem = v, DataDespesa = new(2026, 10, 10), Valor = 150, Origem = "RemuneracaoMotorista", Categoria = "Motorista" },
            new() { Viagem = cancelada, DataDespesa = new(2026, 10, 11), Valor = 40, Categoria = "Pedágio" },
            new() { Caminhao = c, DataDespesa = new(2026, 10, 10), Valor = 70, Categoria = "Oficina" },
            new() { DataDespesa = new(2026, 10, 10), Valor = 30, Categoria = "Contador" },
            new() { Viagem = v, DataDespesa = new(2026, 10, 10), Valor = 999, ConsiderarNoFinanceiro = false },
            new() { Viagem = antiga, DataDespesa = new(2026, 10, 10), Valor = 60, Categoria = "Pedágio" },
            new() { Valor = 20, Categoria = "Legado" });
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        return new(m.Id, outro.Id, c.Id, outroC.Id, v.Id, diesel.Id);
    }
    private static async Task<PreviaFechamento> Consultar(HttpClient client, FiltrosFechamento filtros)
    {
        var response = await client.PostAsJsonAsync("/api/fechamentos/previa", filtros, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<PreviaFechamento>(TestContext.Current.CancellationToken))!;
    }
    private static SalvarFechamentoDto Pedido(PreviaFechamento p) => new() { Titulo = "Acerto de outubro", Filtros = p.Filtros, VersaoPrevia = p.VersaoPrevia, ChaveRequisicao = Guid.NewGuid() };

    [Fact]
    public async Task ApuraTotaisComDatasIndependentesCanceladasEComissaoUmaUnicaVez()
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); await Preparar(factory);
        var p = await Consultar(client, Filtros());
        Assert.Equal(new TotaisFechamento(1000, 350, 100, 450, 150, 550, 2, 6), p.Totais);
        Assert.Contains(p.Viagens, v => !v.IncluidaNaReceita && v.ValorFrete == 500);
        Assert.Contains(p.Despesas, d => d.Valor == 60); // Viagem fora do período, custo dentro.
        Assert.DoesNotContain(p.Despesas, d => d.Valor == 999);
        using var scope = factory.Services.CreateScope(); Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<AppDbContext>().Fechamentos.CountAsync(TestContext.Current.CancellationToken));
    }
    [Theory]
    [InlineData("motorista", 1000, 310, 0, 690)]
    [InlineData("caminhao", 1000, 310, 70, 620)]
    [InlineData("intersecao", 0, 0, 0, 0)]
    [InlineData("categoria", 1000, 100, 0, 900)]
    [InlineData("canceladas", 0, 40, 100, -140)]
    [InlineData("sem-gerais", 1000, 350, 0, 650)]
    [InlineData("sem-periodo", 1400, 350, 120, 930)]
    public async Task CombinaFiltrosSemRateioOuConfundirDataDaViagemComDespesa(string caso, int fretes, int viagens, int gerais, int resultado)
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dados = await Preparar(factory); var f = Filtros();
        if (caso == "motorista") f.MotoristaId = dados.Motorista;
        if (caso == "caminhao") f.CaminhaoId = dados.Caminhao;
        if (caso == "intersecao") { f.MotoristaId = dados.Motorista; f.CaminhaoId = dados.OutroCaminhao; }
        if (caso == "categoria") f.Categoria = " Combustível ";
        if (caso == "canceladas") f.Situacoes = ["Cancelada"];
        if (caso == "sem-gerais") f.IncluirDespesasGerais = false;
        if (caso == "sem-periodo") { f.DataInicial = null; f.DataFinal = null; }
        var p = await Consultar(client, f);
        Assert.Equal(fretes, p.Totais.TotalFretes); Assert.Equal(viagens, p.Totais.TotalDespesasViagens);
        Assert.Equal(gerais, p.Totais.TotalDespesasGerais); Assert.Equal(resultado, p.Totais.Resultado);
    }
    [Fact]
    public async Task PreservaValoresNomesEPlacasMesmoDepoisDeAlterarOuExcluirOrigem()
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dados = await Preparar(factory);
        var p = await Consultar(client, Filtros()); var pedido = Pedido(p);
        var response = await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode); Assert.NotNull(response.Headers.Location);
        var salvo = (await response.Content.ReadFromJsonAsync<AcertoFechamento>(TestContext.Current.CancellationToken))!;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Motoristas.FindAsync([dados.Motorista], TestContext.Current.CancellationToken))!.Nome = "Nome alterado";
            (await db.Caminhoes.FindAsync([dados.Caminhao], TestContext.Current.CancellationToken))!.Placa = "OUTRA";
            (await db.Viagens.FindAsync([dados.Viagem], TestContext.Current.CancellationToken))!.ValorFrete = 2500;
            db.Despesas.Remove((await db.Despesas.FindAsync([dados.Despesa], TestContext.Current.CancellationToken))!);
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
        var historico = (await client.GetFromJsonAsync<AcertoFechamento>($"/api/fechamentos/{salvo.Id}", TestContext.Current.CancellationToken))!;
        Assert.Equal(JsonFechamento.Serializar(p), JsonFechamento.Serializar(historico.Conteudo));
        Assert.Equal(Guid.Parse(ApiFactory.UsuarioTeste), historico.UsuarioId);
        Assert.NotEqual(p.VersaoPrevia, (await Consultar(client, Filtros())).VersaoPrevia);
        // Reenvio depois das mudanças devolve o acerto já criado, sem apurar novamente.
        var repetida = await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken);
        Assert.Equal(salvo.Id, (await repetida.Content.ReadFromJsonAsync<AcertoFechamento>(TestContext.Current.CancellationToken))!.Id);
        var lista = (await client.GetFromJsonAsync<PaginaFechamentos>("/api/fechamentos", TestContext.Current.CancellationToken))!;
        Assert.Equal(1, lista.QuantidadeTotal); Assert.Single(lista.Itens); Assert.Equal(550, lista.Itens[0].Totais.Resultado);
    }
    [Fact]
    public async Task PreviaDesatualizadaOuChaveReutilizadaComOutroConteudoRecebe409()
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var dados = await Preparar(factory);
        var pedido = Pedido(await Consultar(client, Filtros()));
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Despesas.FindAsync([dados.Despesa], TestContext.Current.CancellationToken))!.ConsiderarNoFinanceiro = false;
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken)).StatusCode);
        pedido = Pedido(await Consultar(client, Filtros()));
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken)).StatusCode);
        pedido.Titulo = "Outro acerto";
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken)).StatusCode);
    }
    [Theory]
    [InlineData("periodo")] [InlineData("situacao")] [InlineData("gerais")] [InlineData("motorista")]
    public async Task RecusaFiltrosInvalidos(string caso)
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); var f = Filtros();
        if (caso == "periodo") f.DataFinal = new(2026, 9, 30);
        if (caso == "situacao") f.Situacoes = ["Inventada"];
        if (caso == "gerais") f.IncluirDespesasGerais = null;
        if (caso == "motorista") f.MotoristaId = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/fechamentos/previa", f, TestContext.Current.CancellationToken)).StatusCode);
    }
    [Fact]
    public async Task ExigePeriodoNoSalvamentoEValidaPaginaDetalhesEAutenticacao()
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        var f = Filtros(); f.DataInicial = null; var pedido = Pedido(await Consultar(client, f));
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/fechamentos?pagina=0", TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/fechamentos/{Guid.NewGuid()}", TestContext.Current.CancellationToken)).StatusCode);
        using var anonimo = new ApiFactory(autenticar: false); using var semToken = anonimo.CriarCliente();
        Assert.Equal(HttpStatusCode.Unauthorized, (await semToken.GetAsync("/api/fechamentos", TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await semToken.PostAsJsonAsync("/api/fechamentos/previa", f, TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await semToken.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await semToken.GetAsync($"/api/fechamentos/{Guid.NewGuid()}", TestContext.Current.CancellationToken)).StatusCode);
    }
    [Fact]
    public async Task PeriodoInclusivoNormalizacaoEPaginacaoPreservamLancamentosOriginais()
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente(); await Preparar(factory);
        var f = Filtros(); f.DataInicial = new(2026, 10, 10); f.DataFinal = new(2026, 10, 10);
        f.Situacoes = ["Concluída", "Concluída"];
        var primeira = await Consultar(client, f);
        Assert.Equal(1000, primeira.Totais.TotalFretes);
        Assert.Single(primeira.Filtros.Situacoes!);
        var segunda = await Consultar(client, primeira.Filtros);
        Assert.Equal(primeira.VersaoPrevia, segunda.VersaoPrevia);
        var pedido = Pedido(primeira);
        for (int i = 0; i < 3; i++)
        {
            pedido.ChaveRequisicao = Guid.NewGuid(); pedido.Titulo = $"Acerto {i}";
            Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/fechamentos", pedido, TestContext.Current.CancellationToken)).StatusCode);
        }
        var pagina1 = (await client.GetFromJsonAsync<PaginaFechamentos>("/api/fechamentos?pagina=1&tamanhoPagina=2", TestContext.Current.CancellationToken))!;
        var pagina2 = (await client.GetFromJsonAsync<PaginaFechamentos>("/api/fechamentos?pagina=2&tamanhoPagina=2", TestContext.Current.CancellationToken))!;
        Assert.Equal(3, pagina1.QuantidadeTotal); Assert.Equal(2, pagina1.Itens.Length); Assert.Single(pagina2.Itens);
        Assert.Equal(3, pagina1.Itens.Concat(pagina2.Itens).Select(a => a.Id).Distinct().Count());
        using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(4, await db.Viagens.CountAsync(TestContext.Current.CancellationToken));
        Assert.Equal(8, await db.Despesas.CountAsync(TestContext.Current.CancellationToken));
        Assert.Equal(1000, await db.Viagens.Where(v => v.Status == "Concluída" && v.DataViagem == f.DataInicial).Select(v => v.ValorFrete).SingleAsync(TestContext.Current.CancellationToken));
    }
    [Fact]
    public async Task LegadosSemValorSaoExplicitosSemInventarReceitaOuDespesas()
    {
        using var factory = new ApiFactory(); using var client = factory.CriarCliente();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Viagens.Add(new() { DataViagem = new(2026, 10, 1), Status = " " });
            db.Despesas.Add(new() { DataDespesa = new(2026, 10, 31) });
            await db.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
        var p = await Consultar(client, Filtros());
        Assert.Null(Assert.Single(p.Viagens).ValorFrete); Assert.Null(Assert.Single(p.Despesas).Valor);
        Assert.Equal(0, p.Totais.Resultado); Assert.Contains(p.Avisos, a => a.StartsWith("Há registros sem valor"));
    }
    [Fact]
    public void MigrationSomenteCriaHistoricoESnapshotCorrespondeAoModelo()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=unused.invalid;Database=unused").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        var sql = db.GetService<IMigrator>().GenerateScript("20261029001926_VincularDespesaGeralCaminhao", "20261103030000_CriarFechamentos");
        Assert.Contains("CREATE TABLE fechamentos", sql); Assert.Contains("CREATE UNIQUE INDEX", sql);
        Assert.DoesNotContain("ALTER TABLE viagens", sql); Assert.DoesNotContain("UPDATE", sql); Assert.DoesNotContain("DELETE FROM", sql);
    }
}
