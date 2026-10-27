using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Transportador.Api.Infrastructure;
using Xunit;

namespace Transportador.Api.Tests.Integracao;

public class ProxyTests
{
    [Theory]
    [InlineData("0.0.0.0/0")]
    [InlineData("::/0")]
    [InlineData("invalida")]
    public void NaoPermiteConfiarEmTodasAsOrigensOuRedeInvalida(string rede)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Proxy:RedesConfiaveis:0"] = rede }).Build();
        var services = new ServiceCollection(); services.AddProxyConfiavel(config);
        using var provider = services.BuildServiceProvider();
        Assert.Throws<InvalidOperationException>(() => provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value);
    }

    [Fact]
    public void RedeExplicita_MantemListaRestritaDoFramework()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Proxy:RedesConfiaveis:0"] = "192.0.2.0/24" }).Build();
        var services = new ServiceCollection(); services.AddProxyConfiavel(config);
        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;
        Assert.Contains(System.Net.IPNetwork.Parse("192.0.2.0/24"), options.KnownIPNetworks);
        Assert.True(options.KnownProxies.Count > 0); Assert.Equal(1, options.ForwardLimit);
    }
}
