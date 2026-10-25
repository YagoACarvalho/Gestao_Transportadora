using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Controllers;
using Transportador.Api.Dtos;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;

namespace Transportador.Api.Tests.Motoristas;

public class MotoristasControllerTests
{
    [Fact]
    public async Task Cadastrar_PersisteCamposERetornaCreatedAtAction()
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        await using var context = database.CriarContexto();
        MotoristasController controller = new(context);
        CriarMotoristaDto dto = new()
        {
            Nome = "Motorista ficticio", Cpf = "00000000000", NumeroCnh = "CNH-TESTE",
            CategoriaCnh = "E", DataValidadeCnh = new DateOnly(2030, 1, 1), Telefone = "00000000000"
        };
        DateTime inicio = DateTime.UtcNow;

        var resposta = Assert.IsType<CreatedAtActionResult>((await controller.Cadastrar(dto)).Result);
        DateTime fim = DateTime.UtcNow;
        var criado = Assert.IsType<Motorista>(resposta.Value);
        Assert.True(criado.Ativo);

        Assert.Equal(201, resposta.StatusCode);
        Assert.Equal(nameof(MotoristasController.ObterPorId), resposta.ActionName);
        Assert.NotNull(resposta.RouteValues);
        Assert.Equal(criado.Id, Assert.IsType<Guid>(resposta.RouteValues["id"]));
        Assert.NotEqual(Guid.Empty, criado.Id);
        Assert.Equal(DateTimeKind.Utc, criado.DataCadastro.Kind);
        Assert.InRange(criado.DataCadastro, inicio, fim);
        await using var verificacao = database.CriarContexto();
        var salvo = await verificacao.Motoristas.SingleAsync();
        Assert.True(salvo.Ativo);
        Assert.Equal(criado.Id, salvo.Id);
        Assert.Equal(dto.Nome, salvo.Nome);
        Assert.Equal(dto.Cpf, salvo.Cpf);
        Assert.Equal(dto.NumeroCnh, salvo.NumeroCnh);
        Assert.Equal(dto.CategoriaCnh, salvo.CategoriaCnh);
        Assert.Equal(dto.DataValidadeCnh, salvo.DataValidadeCnh);
        Assert.Equal(dto.Telefone, salvo.Telefone);
        Assert.Equal(criado.DataCadastro, salvo.DataCadastro);
    }

    [Fact]
    public async Task Cadastrar_CriaAtivoEIncluiNaListagemPadrao()
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        await using (var context = database.CriarContexto())
        {
            var resposta = await new MotoristasController(context).Cadastrar(new() { Nome = "Teste" });
            Assert.True(Assert.IsType<Motorista>(Assert.IsType<CreatedAtActionResult>(resposta.Result).Value).Ativo);
        }
        await using var verificacao = database.CriarContexto();
        Assert.True((await verificacao.Motoristas.SingleAsync()).Ativo);
        var controller = new MotoristasController(verificacao);
        Assert.Single(Itens(await controller.Listar()));
        Assert.Single(Itens(await controller.Listar(true)));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task ObterPorId_Existente_RetornaInclusiveInativo(bool ativo)
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        Motorista motorista = new() { Nome = "Teste", Ativo = ativo };
        await database.PrepararAsync(motorista);
        await using var context = database.CriarContexto();

        var resposta = Assert.IsType<OkObjectResult>((await new MotoristasController(context).ObterPorId(motorista.Id)).Result);

        Assert.Equal(200, resposta.StatusCode);
        var encontrado = Assert.IsType<Motorista>(resposta.Value);
        Assert.Equal(motorista.Id, encontrado.Id);
        Assert.Equal(motorista.Nome, encontrado.Nome);
        Assert.Equal(ativo, encontrado.Ativo);
    }

    [Fact]
    public async Task ObterPorId_Inexistente_Retorna404()
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        await using var context = database.CriarContexto();
        Assert.IsType<NotFoundResult>((await new MotoristasController(context).ObterPorId(Guid.NewGuid())).Result);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Listar_FiltraInativosEOrdenaPorNome(bool incluirInativos)
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        await database.PrepararAsync(
            new() { Nome = "Carlos", Ativo = true },
            new() { Nome = "Bruno", Ativo = false },
            new() { Nome = "Ana", Ativo = true });
        await using var context = database.CriarContexto();
        var controller = new MotoristasController(context);

        // Chamada sem argumento exercita o valor padrao do controller.
        var resposta = incluirInativos ? await controller.Listar(true) : await controller.Listar();

        Assert.Equal(200, Assert.IsType<OkObjectResult>(resposta.Result).StatusCode);
        string[] esperado = incluirInativos ? ["Ana", "Bruno", "Carlos"] : ["Ana", "Carlos"];
        Assert.Equal(esperado, Itens(resposta).Select(m => m.Nome).ToArray());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Listar_SemRegistros_RetornaColecaoVazia(bool incluirInativos)
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        await using var context = database.CriarContexto();
        Assert.Empty(Itens(await new MotoristasController(context).Listar(incluirInativos)));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Atualizar_PersisteCamposEPreservaIdentidadeECadastro(bool ativo)
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        Motorista original = new() { Nome = "Anterior", Ativo = !ativo, DataCadastro = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) };
        await database.PrepararAsync(original);
        AtualizarMotoristaDto dto = new()
        {
            Nome = "Atualizado", Cpf = "00000000000", NumeroCnh = "TESTE",
            CategoriaCnh = "D", DataValidadeCnh = new DateOnly(2031, 2, 3), Telefone = "00000000000", Ativo = ativo
        };
        await using (var context = database.CriarContexto())
        {
            var resposta = await new MotoristasController(context).Atualizar(original.Id, dto);
            Assert.Equal(204, Assert.IsType<NoContentResult>(resposta).StatusCode);
        }
        await using var verificacao = database.CriarContexto();
        var salvo = await verificacao.Motoristas.SingleAsync();
        Assert.Equal(original.Id, salvo.Id);
        Assert.Equal(original.DataCadastro, salvo.DataCadastro);
        Assert.Equal(dto.Nome, salvo.Nome);
        Assert.Equal(dto.Cpf, salvo.Cpf);
        Assert.Equal(dto.NumeroCnh, salvo.NumeroCnh);
        Assert.Equal(dto.CategoriaCnh, salvo.CategoriaCnh);
        Assert.Equal(dto.DataValidadeCnh, salvo.DataValidadeCnh);
        Assert.Equal(dto.Telefone, salvo.Telefone);
        Assert.Equal(ativo, salvo.Ativo);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Desativar_MantemRegistroInclusiveSeJaInativo(bool ativo)
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        Motorista motorista = new() { Nome = "Teste", Ativo = ativo };
        await database.PrepararAsync(motorista);
        await using (var context = database.CriarContexto())
        {
            Assert.Equal(204, Assert.IsType<NoContentResult>(await new MotoristasController(context).Desativar(motorista.Id)).StatusCode);
        }
        await using var verificacao = database.CriarContexto();
        var salvo = await verificacao.Motoristas.SingleAsync();
        Assert.Equal(motorista.Id, salvo.Id);
        Assert.Equal(motorista.Nome, salvo.Nome);
        Assert.False(salvo.Ativo);
        var controller = new MotoristasController(verificacao);
        Assert.IsType<OkObjectResult>((await controller.ObterPorId(motorista.Id)).Result);
        Assert.Empty(Itens(await controller.Listar()));
        Assert.Single(Itens(await controller.Listar(true)));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Alterar_Inexistente_Retorna404EPreservaRegistros(bool desativar)
    {
        await using var database = await SqliteTestDatabase.CriarAsync();
        Motorista existente = new() { Nome = "Preservado", Ativo = true };
        await database.PrepararAsync(existente);
        await using (var context = database.CriarContexto())
        {
            var controller = new MotoristasController(context);
            Guid inexistente = Guid.NewGuid();
            var resposta = desativar
                ? await controller.Desativar(inexistente)
                : await controller.Atualizar(inexistente, new() { Nome = "Nao deve existir" });
            Assert.IsType<NotFoundResult>(resposta);
        }
        await using var verificacao = database.CriarContexto();
        var salvo = await verificacao.Motoristas.SingleAsync();
        Assert.Equal(existente.Id, salvo.Id);
        Assert.Equal(existente.Nome, salvo.Nome);
        Assert.True(salvo.Ativo);
    }

    private static IEnumerable<Motorista> Itens(ActionResult<IEnumerable<Motorista>> resposta)
        => Assert.IsAssignableFrom<IEnumerable<Motorista>>(Assert.IsType<OkObjectResult>(resposta.Result).Value);
}
