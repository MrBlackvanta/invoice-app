using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InvoiceApi.Tests;

public class DatabaseMigrationsTests : IDisposable
{
    readonly SqliteConnection connection = new("DataSource=:memory:");

    public DatabaseMigrationsTests() => connection.Open();

    ServiceProvider Gated(bool apply)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["Migrations:Apply"] = apply.ToString() }
            )
            .Build();

        return new ServiceCollection()
            .AddSingleton<IConfiguration>(configuration)
            .AddSingleton(new DatabaseSchema("invoice"))
            .AddDbContext<InvoiceDbContext>(options =>
                options
                    .UseSqlite(connection)
                    .UseSnakeCaseNamingConvention()
                    .ConfigureWarnings(warnings =>
                        warnings.Ignore(RelationalEventId.PendingModelChangesWarning)
                    )
            )
            .BuildServiceProvider();
    }

    [Fact]
    public async Task RefusesToServeASchemaItDoesNotMatch()
    {
        await using var services = Gated(apply: false);

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DatabaseMigrations.EnsureUpToDateAsync<InvoiceDbContext>(services)
        );

        Assert.Contains("InvoiceSchema", error.Message);
        Assert.Contains("Migrations__Apply", error.Message);
    }

    [Fact]
    public async Task LeavesNoLedgerBehindWhenItRefuses()
    {
        await using var services = Gated(apply: false);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DatabaseMigrations.EnsureUpToDateAsync<InvoiceDbContext>(services)
        );

        Assert.Equal(0L, await CountLedgerTables());
    }

    [Fact]
    public async Task AppliesPendingMigrationsWhenTheGateIsOpen()
    {
        await using var services = Gated(apply: true);

        await DatabaseMigrations.EnsureUpToDateAsync<InvoiceDbContext>(services);

        await using var scope = services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();

        Assert.Empty(await database.Database.GetPendingMigrationsAsync());
    }

    [Fact]
    public async Task LetsAnUpToDateDatabaseThroughTheClosedGate()
    {
        await using var opened = Gated(apply: true);
        await DatabaseMigrations.EnsureUpToDateAsync<InvoiceDbContext>(opened);

        await using var closed = Gated(apply: false);

        var refusal = await Record.ExceptionAsync(() =>
            DatabaseMigrations.EnsureUpToDateAsync<InvoiceDbContext>(closed)
        );

        Assert.Null(refusal);
    }

    async Task<long> CountLedgerTables()
    {
        await using var command = connection.CreateCommand();
        command.CommandText =
            "select count(*) from sqlite_master where name = '__EFMigrationsHistory'";

        return (long)(await command.ExecuteScalarAsync())!;
    }

    public void Dispose() => connection.Dispose();
}
