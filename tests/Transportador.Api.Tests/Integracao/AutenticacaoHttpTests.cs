using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Transportador.Api.Authentication;
using Transportador.Api.Models;
using Transportador.Api.Tests.Infraestrutura;
using Xunit;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Transportador.Api.Tests.Integracao;

public class AutenticacaoHttpTests
{
    private const string Issuer = "https://auth-test.invalid/auth/v1";
    private static ApiFactory CriarFactory(SecurityKey chave) => new(false, options =>
    {
        var config = new OpenIdConnectConfiguration { Issuer = Issuer };
        config.SigningKeys.Add(chave);
        // Chaves exclusivamente locais: nunca consulta JWKS ou bancos externos.
        options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(config);
    });
    private static string Token(SecurityKey chave, string? id = null, string? issuer = null,
        string audience = "authenticated", bool expirado = false, string role = "authenticated", string algorithm = SecurityAlgorithms.RsaSha256)
    {
        var token = new JwtSecurityToken(issuer ?? Issuer, audience,
            [new Claim("sub", id ?? ApiFactory.UsuarioTeste), new Claim("role", role)],
            DateTime.UtcNow.AddHours(-1), DateTime.UtcNow.AddMinutes(expirado ? -5 : 10), new SigningCredentials(chave, algorithm));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [Theory]
    [InlineData("Motoristas")]
    [InlineData("Caminhoes")]
    [InlineData("Viagens")]
    [InlineData("Despesas")]
    [InlineData("Relatorios/resumo-financeiro")]
    public async Task NegociosSemToken_Retornam401(string caminho)
    {
        using var rsa = RSA.Create(2048); using var factory = CriarFactory(new RsaSecurityKey(rsa));
        using var client = factory.CriarCliente(); var token = TestContext.Current.CancellationToken;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync($"/api/{caminho}", token)).StatusCode);
        if (caminho.Contains('/')) return;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync($"/api/{caminho}", new { }, token)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PutAsJsonAsync($"/api/{caminho}/{Guid.NewGuid()}", new { }, token)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.DeleteAsync($"/api/{caminho}/{Guid.NewGuid()}", token)).StatusCode);
    }

    [Theory]
    [InlineData("valido", 200)]
    [InlineData("expirado", 401)]
    [InlineData("emissor", 401)]
    [InlineData("destinatario", 401)]
    [InlineData("assinatura", 401)]
    [InlineData("malformado", 401)]
    [InlineData("usuario", 403)]
    [InlineData("anonimo", 403)]
    public async Task Jwt_ValidaAssinaturaEmissorDestinatarioValidadeEPermissao(string caso, int esperado)
    {
        using var rsa = RSA.Create(2048); using var outra = RSA.Create(2048);
        var chave = new RsaSecurityKey(rsa) { KeyId = "chave-teste" };
        using var factory = CriarFactory(new RsaSecurityKey(rsa.ExportParameters(false)) { KeyId = chave.KeyId });
        using var client = factory.CriarCliente();
        string jwt = caso == "malformado" ? "token.invalido.teste" : Token(
            caso == "assinatura" ? new RsaSecurityKey(outra) { KeyId = chave.KeyId } : chave,
            id: caso == "usuario" ? Guid.NewGuid().ToString() : null,
            issuer: caso == "emissor" ? "https://outro.invalid/auth/v1" : null,
            audience: caso == "destinatario" ? "outro" : "authenticated", expirado: caso == "expirado", role: caso == "anonimo" ? "anon" : "authenticated");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
        var response = await client.GetAsync("/api/Motoristas", TestContext.Current.CancellationToken);
        Assert.Equal(esperado, (int)response.StatusCode);
        Assert.DoesNotContain(jwt, await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.DoesNotContain(response.Headers.WwwAuthenticate, h => h.Parameter?.Contains("error_description") == true);
    }

    [Fact]
    public async Task Ecdsa_UsaChavePublicaDoJwks()
    {
        using var ec = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var privada = new ECDsaSecurityKey(ec) { KeyId = "ec-teste" };
        using var publica = ECDsa.Create(ec.ExportParameters(false));
        using var factory = CriarFactory(new ECDsaSecurityKey(publica) { KeyId = privada.KeyId });
        using var client = factory.CriarCliente();
        client.DefaultRequestHeaders.Authorization = new("Bearer", Token(privada, algorithm: SecurityAlgorithms.EcdsaSha256));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/Despesas", TestContext.Current.CancellationToken)).StatusCode);
    }

    [Fact]
    public async Task Logout_SemTokenNaoConsultaDadosEApiInexistenteNaoRetornaHtml()
    {
        using var rsa = RSA.Create(2048); var chave = new RsaSecurityKey(rsa) { KeyId = "teste" };
        using var factory = CriarFactory(chave); using var client = factory.CriarCliente();
        var token = TestContext.Current.CancellationToken;
        client.DefaultRequestHeaders.Authorization = new("Bearer", Token(chave));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/Motoristas", token)).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/Motoristas", token)).StatusCode);
        var response = await client.GetAsync("/api/rota-inexistente", token);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.NotEqual("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task ListaVazia_NegaUsuarioMesmoComTokenValido()
    {
        using var rsa = RSA.Create(2048); var chave = new RsaSecurityKey(rsa) { KeyId = "teste" };
        using var original = CriarFactory(chave);
        using var factory = original.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.PostConfigure<ConfiguracaoAcesso>(options => options.UsuariosPermitidos = [])));
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        client.DefaultRequestHeaders.Authorization = new("Bearer", Token(chave));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/Motoristas", TestContext.Current.CancellationToken)).StatusCode);
    }

    [Fact]
    public async Task AlgoritmoSimetrico_NaoEPermitidoMesmoComChaveConhecida()
    {
        var chave = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(32)) { KeyId = "simetrica-teste" };
        using var factory = CriarFactory(chave); using var client = factory.CriarCliente();
        client.DefaultRequestHeaders.Authorization = new("Bearer", Token(chave, algorithm: SecurityAlgorithms.HmacSha256));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/Motoristas", TestContext.Current.CancellationToken)).StatusCode);
    }

    [Theory]
    [InlineData("https://projeto.supabase.co", true)]
    [InlineData("", false)]
    [InlineData("http://projeto.supabase.co", false)]
    [InlineData("https://usuario:senha@projeto.supabase.co", false)]
    [InlineData("https://projeto.supabase.co/caminho", false)]
    [InlineData("https://projeto.supabase.co?query=teste", false)]
    public void Configuracao_NaoAceitaOrigemInsegura(string url, bool valido)
        => Assert.Equal(valido, ConfiguracaoAcesso.UrlValida(url));
}
