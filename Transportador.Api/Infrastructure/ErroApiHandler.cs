using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Transportador.Api.Infrastructure;

public sealed class ErroApiHandler(ILogger<ErroApiHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        var causa = exception.GetBaseException();
        bool conflito = exception is DbUpdateConcurrencyException || causa is PostgresException
            { SqlState: PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.DeadlockDetected or PostgresErrorCodes.ForeignKeyViolation or PostgresErrorCodes.UniqueViolation };
        int status = conflito ? 409 : 500;
        // Não registrar mensagens do driver, SQL, parâmetros ou conexão.
        logger.LogWarning("Falha de operação: {Tipo}; HTTP {Status}; referência {Referencia}", causa.GetType().Name, status, context.TraceIdentifier);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = conflito ? "Os dados mudaram durante a operação. Atualize a lista e tente novamente."
                : "Não foi possível concluir a operação. Tente novamente.",
            Extensions = { ["referencia"] = context.TraceIdentifier }
        }, cancellationToken);
        return true;
    }
}
