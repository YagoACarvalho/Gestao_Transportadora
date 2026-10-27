using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Transportador.Api.Tests.Infraestrutura;

// Existe somente no assembly de testes. Não há bypass de autenticação na API.
internal sealed class AutenticacaoTesteHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (Request.Headers.Authorization != "Teste permitido") return Task.FromResult(AuthenticateResult.NoResult());
        var identity = new ClaimsIdentity([new("sub", ApiFactory.UsuarioTeste), new("role", "authenticated")], Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
    }
}
