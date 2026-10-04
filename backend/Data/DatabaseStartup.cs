using Microsoft.EntityFrameworkCore;

public static class DatabaseStartup
{
    public static async Task PrepareDatabaseAsync(this WebApplication app)
    {
        await DatabaseMigrations.EnsureUpToDateAsync<InvoiceDbContext>(app.Services);

        await using var scope = app.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();

        if (await database.Invoices.AnyAsync())
        {
            return;
        }

        await SeedInDeclaredOrderAsync(database);
    }

    static async Task SeedInDeclaredOrderAsync(InvoiceDbContext database)
    {
        foreach (var invoice in SeedInvoices.All())
        {
            database.Invoices.Add(invoice);
            await database.SaveChangesAsync();
        }
    }
}
