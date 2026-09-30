using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using InvoiceApi.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApi.Tests;

public class InvoiceEndpointsTests(InvoiceApiFactory factory) : IClassFixture<InvoiceApiFactory>
{
    readonly HttpClient client = factory.CreateClient();

    static Invoice Stored(string id, InvoiceStatus status = InvoiceStatus.Pending)
    {
        var invoice = Sample.Invoice(status);
        invoice.Id = id;
        invoice.Recalculate();

        return invoice;
    }

    async Task<InvoiceResponse> Read(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<InvoiceResponse>(InvoiceApiFactory.Json))!;

    async Task<InvoiceResponse[]> ReadAll(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<InvoiceResponse[]>(InvoiceApiFactory.Json))!;

    Task<HttpResponseMessage> Post(InvoiceRequest request) =>
        client.PostAsJsonAsync("/invoices", request, InvoiceApiFactory.Json);

    Task<HttpResponseMessage> Put(string id, InvoiceRequest request) =>
        client.PutAsJsonAsync($"/invoices/{id}", request, InvoiceApiFactory.Json);

    Task<HttpResponseMessage> Patch(string id, InvoiceStatus status) =>
        client.PatchAsJsonAsync(
            $"/invoices/{id}/status",
            new StatusRequest(status),
            InvoiceApiFactory.Json
        );

    [Fact]
    public async Task ListsEveryStoredInvoice()
    {
        factory.Reset(Stored("AA0001"), Stored("BB0002"));

        var invoices = await ReadAll(await client.GetAsync("/invoices"));

        Assert.Equal(2, invoices.Length);
    }

    [Fact]
    public async Task ListsNothingWhenThereAreNoInvoices()
    {
        factory.Reset();

        Assert.Empty(await ReadAll(await client.GetAsync("/invoices")));
    }

    [Fact]
    public async Task ListsTheLatestPaymentDateFirst()
    {
        var soon = Stored("AA0001");
        soon.CreatedAt = new DateOnly(2021, 1, 1);
        soon.Recalculate();

        var later = Stored("BB0002");
        later.CreatedAt = new DateOnly(2021, 12, 1);
        later.Recalculate();

        factory.Reset(soon, later);

        var invoices = await ReadAll(await client.GetAsync("/invoices"));

        Assert.Equal(["BB0002", "AA0001"], invoices.Select(invoice => invoice.Id));
    }

    [Fact]
    public async Task BreaksATieOnTheMostRecentlyAdded()
    {
        var first = Stored("AA0001");
        var second = Stored("BB0002");

        factory.Reset(first, second);

        var invoices = await ReadAll(await client.GetAsync("/invoices"));

        Assert.Equal(["BB0002", "AA0001"], invoices.Select(invoice => invoice.Id));
    }

    [Fact]
    public async Task NeverLetsAnInvoiceListBeCached()
    {
        factory.Reset();

        var response = await client.GetAsync("/invoices");

        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("Origin", response.Headers.Vary);
    }

    [Fact]
    public async Task FindsOneInvoiceById()
    {
        factory.Reset(Stored("AA0001"));

        var invoice = await Read(await client.GetAsync("/invoices/AA0001"));

        Assert.Equal("AA0001", invoice.Id);
        Assert.Equal("Jensen Huang", invoice.ClientName);
        Assert.Equal(1800.90m, invoice.Total);
    }

    [Theory]
    [InlineData("ZZ9999")]
    [InlineData("nope")]
    [InlineData("AA00011")]
    public async Task AnswersNotFoundForAnIdItDoesNotHold(string id)
    {
        factory.Reset(Stored("AA0001"));

        var response = await client.GetAsync($"/invoices/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreatesAnInvoiceAndSaysWhereItLives()
    {
        factory.Reset();

        var response = await Post(Sample.Request());
        var created = await Read(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal($"/invoices/{created.Id}", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task GivesANewInvoiceAnIdOfTheHouseShape()
    {
        factory.Reset();

        var created = await Read(await Post(Sample.Request()));

        Assert.Matches("^[A-Z]{2}[0-9]{4}$", created.Id);
    }

    [Fact]
    public async Task KeepsWhatItCreated()
    {
        factory.Reset();

        var created = await Read(await Post(Sample.Request()));
        var fetched = await Read(await client.GetAsync($"/invoices/{created.Id}"));

        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal(created.Total, fetched.Total);
    }

    [Fact]
    public async Task WorksOutThePaymentDateItself()
    {
        factory.Reset();

        var created = await Read(
            await Post(Sample.Request(createdAt: new DateOnly(2021, 8, 18), paymentTerms: 14))
        );

        Assert.Equal(new DateOnly(2021, 9, 1), created.PaymentDue);
    }

    [Fact]
    public async Task WorksOutTheTotalsItself()
    {
        factory.Reset();

        var created = await Read(
            await Post(
                Sample.Request(
                    items:
                    [
                        new InvoiceItemPayload("Banner", 3, 1800.90m),
                        new InvoiceItemPayload("Logo", 1, 100.00m),
                    ]
                )
            )
        );

        Assert.Equal(5502.70m, created.Total);
        Assert.Equal(5402.70m, created.Items[0].Total);
    }

    [Fact]
    public async Task TrimsWhitespaceOffWhatItStores()
    {
        factory.Reset();

        var created = await Read(
            await Post(Sample.Request() with { ClientName = "  Jensen Huang  " })
        );

        Assert.Equal("Jensen Huang", created.ClientName);
    }

    [Fact]
    public async Task RefusesAnIncompletePendingInvoice()
    {
        factory.Reset();

        var response = await Post(Sample.Request() with { ClientName = "", Description = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task NamesEveryFieldItRefused()
    {
        factory.Reset();

        var response = await Post(Sample.Request() with { ClientName = "", Items = [] });
        var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var errors = problem.RootElement.GetProperty("errors");

        Assert.True(errors.TryGetProperty("clientName", out _));
        Assert.True(errors.TryGetProperty("addItem", out _));
    }

    [Fact]
    public async Task StoresNothingWhenItRefuses()
    {
        factory.Reset();

        await Post(Sample.Request() with { ClientName = "" });

        Assert.Empty(await ReadAll(await client.GetAsync("/invoices")));
    }

    [Fact]
    public async Task AcceptsADraftWithNothingButADateAndTerms()
    {
        factory.Reset();

        var response = await Post(
            new InvoiceRequest(
                new DateOnly(2021, 8, 18),
                30,
                InvoiceStatus.Draft,
                null,
                null,
                null,
                null,
                null,
                null
            )
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task RefusesADraftWithNoDateAlthoughTheFieldIsOptional()
    {
        factory.Reset();

        var response = await Post(
            new InvoiceRequest(null, 30, InvoiceStatus.Draft, null, null, null, null, null, null)
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RefusesAPaymentTermItDoesNotOffer()
    {
        factory.Reset();

        var response = await Post(Sample.Request(paymentTerms: 45));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RefusesANegativeQuantity()
    {
        factory.Reset();

        var response = await Post(
            Sample.Request(items: [new InvoiceItemPayload("Banner", -1, 10m)])
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ReplacesAnInvoiceWholesale()
    {
        factory.Reset(Stored("AA0001"));

        var response = await Put(
            "AA0001",
            Sample.Request() with
            {
                ClientName = "Alex Grim",
                Description = "Website Redesign",
            }
        );
        var updated = await Read(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Alex Grim", updated.ClientName);
        Assert.Equal("Website Redesign", updated.Description);
    }

    [Fact]
    public async Task KeepsTheIdWhenItReplaces()
    {
        factory.Reset(Stored("AA0001"));

        var updated = await Read(await Put("AA0001", Sample.Request()));

        Assert.Equal("AA0001", updated.Id);
    }

    [Fact]
    public async Task RecalculatesTotalsWhenItReplaces()
    {
        factory.Reset(Stored("AA0001"));

        var updated = await Read(
            await Put("AA0001", Sample.Request(items: [new InvoiceItemPayload("Banner", 2, 50m)]))
        );

        Assert.Equal(100m, updated.Total);
        Assert.Equal(100m, Assert.Single(updated.Items).Total);
    }

    [Fact]
    public async Task ReplacesTheItemListRatherThanAppendingToIt()
    {
        factory.Reset(Stored("AA0001"));

        var updated = await Read(
            await Put("AA0001", Sample.Request(items: [new InvoiceItemPayload("Only", 1, 1m)]))
        );

        Assert.Equal("Only", Assert.Single(updated.Items).Name);
    }

    [Fact]
    public async Task WillNotReplaceAnInvoiceThatDoesNotExist()
    {
        factory.Reset();

        Assert.Equal(HttpStatusCode.NotFound, (await Put("ZZ9999", Sample.Request())).StatusCode);
    }

    [Fact]
    public async Task RefusesToReplaceWithAnIncompleteInvoice()
    {
        factory.Reset(Stored("AA0001"));

        var response = await Put("AA0001", Sample.Request() with { ClientEmail = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task LeavesTheStoredInvoiceAloneWhenItRefusesToReplace()
    {
        factory.Reset(Stored("AA0001"));

        await Put("AA0001", Sample.Request() with { ClientName = "Alex Grim", ClientEmail = "" });
        var unchanged = await Read(await client.GetAsync("/invoices/AA0001"));

        Assert.Equal("Jensen Huang", unchanged.ClientName);
    }

    [Fact]
    public async Task MarksAnInvoicePaid()
    {
        factory.Reset(Stored("AA0001"));

        var updated = await Read(await Patch("AA0001", InvoiceStatus.Paid));

        Assert.Equal(InvoiceStatus.Paid, updated.Status);
    }

    [Fact]
    public async Task KeepsTheStatusItWasGivenAcrossAReload()
    {
        factory.Reset(Stored("AA0001"));

        await Patch("AA0001", InvoiceStatus.Paid);
        var reloaded = await Read(await client.GetAsync("/invoices/AA0001"));

        Assert.Equal(InvoiceStatus.Paid, reloaded.Status);
    }

    [Fact]
    public async Task WillNotChangeTheStatusOfAnInvoiceThatDoesNotExist()
    {
        factory.Reset();

        var response = await Patch("ZZ9999", InvoiceStatus.Paid);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task RefusesToPromoteAnIncompleteDraft()
    {
        var draft = Stored("AA0001", InvoiceStatus.Draft);
        draft.ClientName = string.Empty;
        factory.Reset(draft);

        var response = await Patch("AA0001", InvoiceStatus.Pending);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task LeavesAnIncompleteDraftAsADraftWhenItRefuses()
    {
        var draft = Stored("AA0001", InvoiceStatus.Draft);
        draft.ClientName = string.Empty;
        factory.Reset(draft);

        await Patch("AA0001", InvoiceStatus.Pending);
        var unchanged = await Read(await client.GetAsync("/invoices/AA0001"));

        Assert.Equal(InvoiceStatus.Draft, unchanged.Status);
    }

    [Fact]
    public async Task DeletesAnInvoice()
    {
        factory.Reset(Stored("AA0001"));

        var response = await client.DeleteAsync("/invoices/AA0001");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task ForgetsAnInvoiceItDeleted()
    {
        factory.Reset(Stored("AA0001"));

        await client.DeleteAsync("/invoices/AA0001");

        Assert.Equal(
            HttpStatusCode.NotFound,
            (await client.GetAsync("/invoices/AA0001")).StatusCode
        );
    }

    [Fact]
    public async Task DeletesTheItemsAlongWithTheInvoice()
    {
        factory.Reset(Stored("AA0001"));

        await client.DeleteAsync("/invoices/AA0001");

        using var database = factory.Database();
        var remaining = await database
            .Database.SqlQueryRaw<int>("SELECT COUNT(*) AS \"Value\" FROM invoice_items")
            .SingleAsync();

        Assert.Equal(0, remaining);
    }

    [Fact]
    public async Task AnswersNotFoundWhenDeletingTwice()
    {
        factory.Reset(Stored("AA0001"));

        await client.DeleteAsync("/invoices/AA0001");
        var second = await client.DeleteAsync("/invoices/AA0001");

        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
    }

    [Fact]
    public async Task ReportsItsHealth()
    {
        factory.Reset();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
    }
}
