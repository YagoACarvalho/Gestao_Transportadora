using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Models;

namespace Transportador.Api.Infrastructure;

// Usa as colunas existentes: não cria versão ou modifica o esquema do banco.
public sealed class EdicaoConcorrenteFilter(AppDbContext context) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext action, ActionExecutionDelegate next)
    {
        Type? tipo = action.RouteData.Values["controller"]?.ToString() switch
        {
            "Motoristas" => typeof(Motorista), "Caminhoes" => typeof(Caminhao),
            "Viagens" => typeof(Viagem), "Despesas" => typeof(Despesa), _ => null
        };
        var request = action.HttpContext.Request;
        bool escrita = HttpMethods.IsPost(request.Method) || HttpMethods.IsPut(request.Method) || HttpMethods.IsDelete(request.Method) || HttpMethods.IsPatch(request.Method);
        if (tipo is null) { await next(); return; }

        await using var transaction = escrita
            ? await context.Database.BeginTransactionAsync(IsolationLevel.Serializable, action.HttpContext.RequestAborted)
            : null;
        if (escrita && action.ActionArguments.TryGetValue("id", out var id) && id is Guid guid && request.Headers.ContainsKey("If-Match"))
        {
            var atual = await context.FindAsync(tipo, [guid], action.HttpContext.RequestAborted);
            if (atual is not null && request.Headers.IfMatch.ToString() != Tag(atual))
            {
                action.Result = new ConflictObjectResult(new ProblemDetails { Status = 409,
                    Title = "O cadastro foi alterado por outra operação. Atualize os dados antes de salvar." });
                return;
            }
        }

        var executed = await next();
        if (executed.Exception is not null && !executed.ExceptionHandled) return;
        if (transaction is not null) await transaction.CommitAsync(action.HttpContext.RequestAborted);
        if (executed.Result is ObjectResult { Value: not null } result && tipo.IsInstanceOfType(result.Value))
            action.HttpContext.Response.Headers.ETag = Tag(result.Value);
    }

    private string Tag(object entity)
    {
        // Somente campos escalares: mudanças no nome de um vínculo não alteram esta versão.
        var campos = context.Entry(entity).Properties.OrderBy(p => p.Metadata.Name)
            .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
        return '"' + Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(campos))) + '"';
    }
}
