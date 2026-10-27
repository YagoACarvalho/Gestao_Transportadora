using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Transportador.Api.Authentication;

public static class AutenticacaoExtensions
{
    public static IServiceCollection AddAcessoTransportadora(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<ConfiguracaoAcesso>().Bind(configuration.GetSection("Supabase"))
            .Validate(o => ConfiguracaoAcesso.UrlValida(o.Url), "Configure Supabase:Url com a origem HTTPS do projeto.")
            .Validate(o => o.UsuariosPermitidos.All(id => Guid.TryParse(id, out _)), "Supabase:UsuariosPermitidos deve conter IDs de usuários válidos.")
            .ValidateOnStart();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<ConfiguracaoAcesso>>((options, acesso) =>
            {
                string issuer = acesso.Value.Url.TrimEnd('/') + "/auth/v1";
                options.MapInboundClaims = false;
                options.RequireHttpsMetadata = true;
                options.IncludeErrorDetails = false;
                options.SaveToken = false;
                options.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                    issuer + "/.well-known/jwks.json", new SupabaseJwksRetriever(issuer),
                    new HttpDocumentRetriever { RequireHttps = true });
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true, ValidIssuer = issuer,
                    ValidateAudience = true, ValidAudience = "authenticated",
                    ValidateLifetime = true, RequireExpirationTime = true,
                    ValidateIssuerSigningKey = true, RequireSignedTokens = true,
                    ValidAlgorithms = [SecurityAlgorithms.RsaSha256, SecurityAlgorithms.EcdsaSha256],
                    ClockSkew = TimeSpan.FromSeconds(30), NameClaimType = "email"
                };
            });
        services.AddAuthorization(options =>
        {
            options.AddPolicy("Transportadora", policy => policy.RequireAuthenticatedUser()
                .RequireClaim("role", "authenticated")
                .RequireAssertion(ctx => Guid.TryParse(ctx.User.FindFirst("sub")?.Value, out var id)
                    && ctx.Resource is HttpContext http
                    && http.RequestServices.GetRequiredService<IOptionsMonitor<ConfiguracaoAcesso>>()
                        .CurrentValue.UsuariosPermitidos.Any(permitido => Guid.TryParse(permitido, out var usuario) && usuario == id)));
        });
        return services;
    }
}
