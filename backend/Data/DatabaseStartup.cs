using Microsoft.EntityFrameworkCore;

public static class DatabaseStartup
{
    public static async Task PrepareDatabaseAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();

        await database.Database.MigrateAsync();

        if (await database.Invoices.AnyAsync())
        {
            return;
        }

        await SeedInListOrderAsync(database);
    }

    static async Task SeedInListOrderAsync(InvoiceDbContext database)
    {
        foreach (var invoice in SeedInvoices.All())
        {
            database.Invoices.Add(invoice);
            await database.SaveChangesAsync();
        }
    }
}
