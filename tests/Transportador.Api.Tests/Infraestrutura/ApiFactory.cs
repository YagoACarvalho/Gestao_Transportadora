using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Transportador.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.TestHost;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Transportador.Api.Tests.Infraestrutura;

internal sealed class ApiFactory(bool autenticar = true, Action<JwtBearerOptions>? configurarJwt = null) : WebApplicationFactory<Program>
{
    public const string UsuarioTeste = "11111111-1111-4111-8111-111111111111";
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Testing nao carrega User Secrets. O valor sentinela nunca e conectado:
        // o registro Npgsql e substituido antes da criacao do contexto.
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=unused.invalid;Database=unused");
        builder.UseSetting("Supabase:Url", "https://auth-test.invalid");
        builder.UseSetting("Supabase:UsuariosPermitidos:0", UsuarioTeste);
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            _connection.Open();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
        if (autenticar) builder.ConfigureTestServices(services => services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = "Teste";
            options.DefaultChallengeScheme = "Teste";
            options.DefaultForbidScheme = "Teste";
        }).AddScheme<AuthenticationSchemeOptions, AutenticacaoTesteHandler>("Teste", _ => { }));
        if (configurarJwt is not null) builder.ConfigureTestServices(services =>
            services.PostConfigure(JwtBearerDefaults.AuthenticationScheme, configurarJwt));
    }

    public HttpClient CriarCliente()
    {
        var client = CreateClient(new() { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
        if (autenticar) client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Teste", "permitido");
        using var scope = Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
