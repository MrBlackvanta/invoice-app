using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddOpenApi();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)
    )
);
builder.Services.AddDbContext<InvoiceDbContext>(options =>
    options
        .UseNpgsql(DatabaseConnection.Resolve(builder.Configuration))
        .UseSnakeCaseNamingConvention()
);
builder.Services.AddProblemDetails();
builder
    .Services.AddHealthChecks()
    .AddDbContextCheck<InvoiceDbContext>(customTestQuery: InvoiceTableAnswers);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }
        )
    );
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.UseHttpsRedirection();
}

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.Use(NeverCache);
app.UseRateLimiter();

app.MapHealthChecks("/health").DisableRateLimiting();
app.MapInvoices();

await app.PrepareDatabaseAsync();

app.Run();

static async Task<bool> InvoiceTableAnswers(InvoiceDbContext database, CancellationToken token)
{
    await database.Invoices.Select(invoice => invoice.Id).FirstOrDefaultAsync(token);

    return true;
}

static Task NeverCache(HttpContext context, RequestDelegate next)
{
    context.Response.Headers.CacheControl = "no-store";
    context.Response.Headers.Vary = "Origin";

    return next(context);
}
