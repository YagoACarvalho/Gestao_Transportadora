using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Infrastructure;
using Transportador.Api.Authentication;


var builder = WebApplication.CreateBuilder(args);

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
if (app.Environment.IsProduction()) app.UseHsts();
app.Use(async (context, next) =>
{
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

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers().RequireAuthorization("Transportadora");

app.Run();

public partial class Program { }
