using Microsoft.AspNetCore.HttpOverrides;

namespace Transportador.Api.Infrastructure;

public static class ProxyExtensions
{
    public static IServiceCollection AddProxyConfiavel(this IServiceCollection services, IConfiguration configuration)
    {
        var redes = configuration.GetSection("Proxy:RedesConfiaveis").Get<string[]>() ?? [];
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
            foreach (var rede in redes)
            {
                if (!System.Net.IPNetwork.TryParse(rede, out var network) || network.PrefixLength == 0)
                    throw new InvalidOperationException("Proxy:RedesConfiaveis deve conter redes CIDR específicas do proxy, nunca todas as origens.");
                options.KnownIPNetworks.Add(network);
            }
        });
        return services;
    }
}
