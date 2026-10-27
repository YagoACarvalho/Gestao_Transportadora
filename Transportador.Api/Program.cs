using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Infrastructure;
using Transportador.Api.Authentication;


var builder = WebApplication.CreateBuilder(args);
var httpsNoRender = builder.Configuration.GetValue<bool>("Hospedagem:HttpsGerenciadoRender");
if (httpsNoRender && (!builder.Environment.IsProduction() || builder.Configuration["RENDER"] != "true"))
    throw new InvalidOperationException("HTTPS gerenciado pelo Render exige Production e o ambiente Render.");

// Add services to the container.

builder.Services.AddControllers(options => options.Filters.Add<EdicaoConcorrenteFilter>());
builder.Services.AddExceptionHandler<ErroApiHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddAcessoTransportadora(builder.Configuration);
builder.Services.AddProxyConfiavel(builder.Configuration);

string connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' not found."
    );

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddOpenApi();

var app = builder.Build();
app.UseForwardedHeaders();
app.UseExceptionHandler(new ExceptionHandlerOptions { SuppressDiagnosticsCallback = _ => true });
if (app.Environment.IsProduction() && !httpsNoRender) app.UseHsts();
app.Use(async (context, next) =>
{
    // No Render, TLS e redirecionamento sao garantidos na borda. Nao inferir
    // o esquema a partir de cabecalhos recebidos de proxies desconhecidos.
    if (httpsNoRender)
        context.Response.Headers["Strict-Transport-Security"] = "max-age=2592000";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers.XFrameOptions = "DENY";
    if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path == "/" || context.Request.Path == "/index.html")
        context.Response.Headers.CacheControl = "no-store";
    if (app.Environment.IsProduction())
    {
        var origin = app.Configuration["Supabase:Url"]?.TrimEnd('/');
        context.Response.Headers.ContentSecurityPolicy = $"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' {origin}; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
    }
    await next();
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!httpsNoRender) app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers().RequireAuthorization("Transportadora");

app.Run();

public partial class Program { }
