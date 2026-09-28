using System.Diagnostics;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Npgsql;

public static class InvoiceEndpoints
{
    const int IdAttempts = 5;

    public static RouteGroupBuilder MapInvoices(this IEndpointRouteBuilder routes)
    {
        var invoices = routes.MapGroup("/invoices").WithTags("Invoices");

        invoices.MapGet("/", ListAsync);
        invoices.MapGet("/{id}", FindAsync);
        invoices.MapPost("/", CreateAsync);
        invoices.MapPut("/{id}", ReplaceAsync);
        invoices.MapPatch("/{id}/status", ChangeStatusAsync);
        invoices.MapDelete("/{id}", DeleteAsync);

        return invoices;
    }

    static async Task<Ok<InvoiceResponse[]>> ListAsync(
        InvoiceDbContext database,
        CancellationToken token
    )
    {
        var invoices = await database
            .Invoices.AsNoTracking()
            .OrderByDescending(invoice => invoice.PaymentDue)
            .ThenByDescending(invoice => invoice.Sequence)
            .ToListAsync(token);

        return TypedResults.Ok(invoices.Select(invoice => invoice.ToResponse()).ToArray());
    }

    static async Task<Results<Ok<InvoiceResponse>, NotFound>> FindAsync(
        string id,
        InvoiceDbContext database,
        CancellationToken token
    )
    {
        var invoice = await database
            .Invoices.AsNoTracking()
            .FirstOrDefaultAsync(entity => entity.Id == id, token);

        return invoice is null ? TypedResults.NotFound() : TypedResults.Ok(invoice.ToResponse());
    }

    static async Task<Results<Created<InvoiceResponse>, ValidationProblem>> CreateAsync(
        InvoiceRequest request,
        InvoiceDbContext database,
        CancellationToken token
    )
    {
        var invoice = request.ToInvoice(InvoiceId.Next());
        var problems = InvoiceRules.Check(invoice);

        if (problems.Count > 0)
        {
            return TypedResults.ValidationProblem(problems);
        }

        await InsertAsync(database, invoice, token);

        return TypedResults.Created($"/invoices/{invoice.Id}", invoice.ToResponse());
    }

    static async Task<Results<Ok<InvoiceResponse>, NotFound, ValidationProblem>> ReplaceAsync(
        string id,
        InvoiceRequest request,
        InvoiceDbContext database,
        CancellationToken token
    )
    {
        var invoice = await database.Invoices.FirstOrDefaultAsync(entity => entity.Id == id, token);

        if (invoice is null)
        {
            return TypedResults.NotFound();
        }

        request.ApplyTo(invoice);

        var problems = InvoiceRules.Check(invoice);

        if (problems.Count > 0)
        {
            return TypedResults.ValidationProblem(problems);
        }

        await database.SaveChangesAsync(token);

        return TypedResults.Ok(invoice.ToResponse());
    }

    static async Task<Results<Ok<InvoiceResponse>, NotFound, ValidationProblem>> ChangeStatusAsync(
        string id,
        StatusRequest request,
        InvoiceDbContext database,
        CancellationToken token
    )
    {
        var invoice = await database.Invoices.FirstOrDefaultAsync(entity => entity.Id == id, token);

        if (invoice is null)
        {
            return TypedResults.NotFound();
        }

        invoice.Status = request.Status;

        var problems = InvoiceRules.Check(invoice);

        if (problems.Count > 0)
        {
            return TypedResults.ValidationProblem(problems);
        }

        await database.SaveChangesAsync(token);

        return TypedResults.Ok(invoice.ToResponse());
    }

    static async Task<Results<NoContent, NotFound>> DeleteAsync(
        string id,
        InvoiceDbContext database,
        CancellationToken token
    )
    {
        var deleted = await database
            .Invoices.Where(invoice => invoice.Id == id)
            .ExecuteDeleteAsync(token);

        return deleted == 0 ? TypedResults.NotFound() : TypedResults.NoContent();
    }

    static async Task InsertAsync(
        InvoiceDbContext database,
        Invoice invoice,
        CancellationToken token
    )
    {
        for (var attempt = 1; attempt <= IdAttempts; attempt++)
        {
            database.Invoices.Add(invoice);

            try
            {
                await database.SaveChangesAsync(token);
                return;
            }
            catch (DbUpdateException error) when (IsDuplicateId(error) && attempt < IdAttempts)
            {
                database.ChangeTracker.Clear();
                invoice.Id = InvoiceId.Next();
            }
        }

        throw new UnreachableException();
    }

    static bool IsDuplicateId(DbUpdateException error) =>
        error.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
