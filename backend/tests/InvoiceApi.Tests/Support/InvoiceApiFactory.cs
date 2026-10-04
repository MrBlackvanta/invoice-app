using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace InvoiceApi.Tests.Support;

public class InvoiceApiFactory : WebApplicationFactory<Program>
{
    readonly SqliteConnection connection = new("DataSource=:memory:");

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    protected virtual bool LimitsRequests => false;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        connection.Open();

        builder.UseEnvironment(Environments.Production);
        builder.UseSetting("Database:Schema", "invoice");
        builder.UseSetting("Migrations:Apply", "true");
        builder.ConfigureServices(services =>
        {
            ForgetPostgres(services);

            if (!LimitsRequests)
            {
                services.PostConfigure<RateLimiterOptions>(options => options.GlobalLimiter = null);
            }

            services.AddDbContext<InvoiceDbContext>(options =>
                options
                    .UseSqlite(connection)
                    .UseSnakeCaseNamingConvention()
                    .ReplaceService<IModelCustomizer, IdentityColumnsAreClientGenerated>()
                    .ConfigureWarnings(warnings =>
                        warnings.Ignore(RelationalEventId.PendingModelChangesWarning)
                    )
            );
        });
    }

    public InvoiceDbContext Database()
    {
        var scope = Services.CreateScope();

        return scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();
    }

    public void Reset(params Invoice[] invoices)
    {
        using var scope = Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();

        database.Invoices.RemoveRange(database.Invoices);
        database.SaveChanges();
        database.Invoices.AddRange(invoices);
        database.SaveChanges();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            connection.Dispose();
        }
    }

    static void ForgetPostgres(IServiceCollection services)
    {
        var registered = services
            .Where(descriptor =>
                descriptor.ServiceType == typeof(InvoiceDbContext)
                || descriptor.ServiceType.FullName?.Contains("DbContextOptions") == true
            )
            .ToList();

        registered.ForEach(descriptor => services.Remove(descriptor));
    }
}
