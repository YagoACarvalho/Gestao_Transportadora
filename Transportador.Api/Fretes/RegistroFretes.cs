using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;

namespace Transportador.Api.Fretes;

public static class RegistroFretes
{
    public static IServiceCollection AddFretes(this IServiceCollection services)
    {
        services.AddSingleton<TabelaAntt>();
        services.AddSingleton(_ => ClienteMapas.CriarHttp());
        services.AddSingleton<ClienteMapas>();
        services.AddSingleton<IMapasFrete, MapasOrs>();
        services.AddKeyedSingleton<IMemoryCache>("FretesTiles", (_, _) => new MemoryCache(new MemoryCacheOptions { SizeLimit = 64 * 1024 * 1024 }));
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = 429;
            options.OnRejected = async (context, ct) =>
            {
                context.HttpContext.Response.Headers.RetryAfter = "60";
                await context.HttpContext.Response.WriteAsJsonAsync(new { title = "Limite de consultas atingido. Aguarde um minuto e tente novamente." }, ct);
            };
            foreach (var (nome, limite) in new[] { ("fretes-calcular", 10), ("fretes-sugestoes", 60), ("fretes-tiles", 300) })
                options.AddPolicy(nome, context => RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub") ?? "sem-usuario",
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = limite, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true }));
        });
        return services;
    }
}
