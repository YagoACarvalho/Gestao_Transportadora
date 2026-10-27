using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Transportador.Api.Infrastructure;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class ErroApiHandlerTests
{
    [Theory]
    [InlineData("40001", 409)]
    [InlineData("40P01", 409)]
    [InlineData("23503", 409)]
    [InlineData("23505", 409)]
    [InlineData("XX000", 500)]
    public async Task ErrosDePersistencia_NaoRevelamDetalhes(string codigo, int status)
    {
        var context = new DefaultHttpContext(); context.Response.Body = new MemoryStream();
        var exception = new PostgresException("DETALHE_INTERNO_TESTE", "ERROR", "ERROR", codigo);
        var handler = new ErroApiHandler(NullLogger<ErroApiHandler>.Instance);
        Assert.True(await handler.TryHandleAsync(context, exception, TestContext.Current.CancellationToken));
        Assert.Equal(status, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync(TestContext.Current.CancellationToken);
        Assert.DoesNotContain("DETALHE_INTERNO_TESTE", body); Assert.DoesNotContain(codigo, body);
    }
}
