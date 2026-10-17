using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Transportador.Api.Data;
using Transportador.Api.Models;

namespace Transportador.Api.Tests.Infraestrutura;

internal sealed class SqliteTestDatabase : IAsyncDisposable
{
    private readonly SqliteConnection _connection;

    private SqliteTestDatabase(SqliteConnection connection)
    {
        _connection = connection;
    }

    public static async Task<SqliteTestDatabase> CriarAsync()
    {
        // Conexao exclusiva e efemera: nao le configuracao da API ou User Secrets.
        SqliteConnection connection = new("Data Source=:memory:");
        try
        {
            await connection.OpenAsync();
            SqliteTestDatabase database = new(connection);
            await using var context = database.CriarContexto();
            await context.Database.EnsureCreatedAsync();
            return database;
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }

    public AppDbContext CriarContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new AppDbContext(options);
    }

    public async Task PrepararAsync(params Motorista[] motoristas)
    {
        await using var context = CriarContexto();
        context.Motoristas.AddRange(motoristas);
        await context.SaveChangesAsync();
    }

    public ValueTask DisposeAsync() => _connection.DisposeAsync();
}
