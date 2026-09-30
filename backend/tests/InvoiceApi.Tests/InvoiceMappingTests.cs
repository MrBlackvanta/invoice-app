using InvoiceApi.Tests.Support;

namespace InvoiceApi.Tests;

public class InvoiceMappingTests
{
    [Fact]
    public void GivesTheNewInvoiceTheIdItWasHanded()
    {
        Assert.Equal("AB1234", Sample.Request().ToInvoice("AB1234").Id);
    }

    [Fact]
    public void CopiesEveryFieldOffTheRequest()
    {
        var invoice = Sample.Request().ToInvoice("AB1234");

        Assert.Equal(new DateOnly(2021, 8, 18), invoice.CreatedAt);
        Assert.Equal(30, invoice.PaymentTerms);
        Assert.Equal(InvoiceStatus.Pending, invoice.Status);
        Assert.Equal("Re-branding", invoice.Description);
        Assert.Equal("Jensen Huang", invoice.ClientName);
        Assert.Equal("London", invoice.SenderAddress.City);
        Assert.Equal("E1 3EZ", invoice.ClientAddress.PostCode);
    }

    [Fact]
    public void TrimsSurroundingWhitespaceFromText()
    {
        var request = Sample.Request() with
        {
            ClientName = "  Jensen Huang  ",
            Description = "\tRe-branding\n",
        };

        var invoice = request.ToInvoice("AB1234");

        Assert.Equal("Jensen Huang", invoice.ClientName);
        Assert.Equal("Re-branding", invoice.Description);
    }

    [Fact]
    public void TurnsNullTextIntoEmptyStrings()
    {
        var request = Sample.Request() with
        {
            Description = null,
            ClientName = null,
            ClientEmail = null,
        };

        var invoice = request.ToInvoice("AB1234");

        Assert.Equal(string.Empty, invoice.Description);
        Assert.Equal(string.Empty, invoice.ClientName);
        Assert.Equal(string.Empty, invoice.ClientEmail);
    }

    [Fact]
    public void TurnsAMissingAddressIntoAnEmptyOne()
    {
        var request = Sample.Request() with { SenderAddress = null, ClientAddress = null };

        var invoice = request.ToInvoice("AB1234");

        Assert.Equal(string.Empty, invoice.SenderAddress.Street);
        Assert.Equal(string.Empty, invoice.SenderAddress.City);
        Assert.Equal(string.Empty, invoice.ClientAddress.PostCode);
        Assert.Equal(string.Empty, invoice.ClientAddress.Country);
    }

    [Fact]
    public void TurnsMissingItemsIntoAnEmptyList()
    {
        var invoice = (Sample.Request() with { Items = null }).ToInvoice("AB1234");

        Assert.Empty(invoice.Items);
        Assert.Equal(0m, invoice.Total);
    }

    [Fact]
    public void TurnsAMissingDateIntoTheDefault()
    {
        var invoice = (Sample.Request() with { CreatedAt = null }).ToInvoice("AB1234");

        Assert.Equal(default, invoice.CreatedAt);
    }

    [Fact]
    public void TrimsItemNames()
    {
        var request = Sample.Request(items: [new InvoiceItemPayload("  Banner  ", 1, 10m)]);

        Assert.Equal("Banner", request.ToInvoice("AB1234").Items.Single().Name);
    }

    [Fact]
    public void ReplacesTheItemsOfAnInvoiceItIsAppliedTo()
    {
        var invoice = Sample.Invoice();
        var request = Sample.Request(items: [new InvoiceItemPayload("Banner", 2, 5m)]);

        request.ApplyTo(invoice);

        Assert.Equal("Banner", Assert.Single(invoice.Items).Name);
    }

    [Fact]
    public void KeepsTheIdOfAnInvoiceItIsAppliedTo()
    {
        var invoice = Sample.Invoice();

        Sample.Request().ApplyTo(invoice);

        Assert.Equal("RT3080", invoice.Id);
    }

    [Fact]
    public void RecalculatesTheTotalsWhenApplied()
    {
        var invoice = Sample.Invoice();
        var request = Sample.Request(items: [new InvoiceItemPayload("Banner", 3, 1800.90m)]);

        request.ApplyTo(invoice);

        Assert.Equal(5402.70m, invoice.Total);
        Assert.Equal(5402.70m, invoice.Items.Single().Total);
    }

    [Fact]
    public void AnswersWithEveryFieldTheClientNeeds()
    {
        var response = Sample.Invoice().ToResponse();

        Assert.Equal("RT3080", response.Id);
        Assert.Equal(new DateOnly(2021, 8, 18), response.CreatedAt);
        Assert.Equal(new DateOnly(2021, 9, 17), response.PaymentDue);
        Assert.Equal(InvoiceStatus.Pending, response.Status);
        Assert.Equal("London", response.SenderAddress.City);
        Assert.Equal(1800.90m, response.Total);
    }

    [Fact]
    public void AnswersWithItemsInTheirStoredOrder()
    {
        var invoice = Sample.Invoice();
        invoice.Items =
        [
            new InvoiceItem { Name = "Third", Position = 2 },
            new InvoiceItem { Name = "First", Position = 0 },
            new InvoiceItem { Name = "Second", Position = 1 },
        ];

        var names = invoice.ToResponse().Items.Select(item => item.Name);

        Assert.Equal(["First", "Second", "Third"], names);
    }

    [Fact]
    public void AnswersWithAnEmptyItemListRatherThanNull()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [];

        Assert.Empty(invoice.ToResponse().Items);
    }

    [Fact]
    public void SurvivesARoundTripThroughTheRequestShape()
    {
        var original = Sample.Invoice();
        var response = original.ToResponse();

        var request = new InvoiceRequest(
            response.CreatedAt,
            response.PaymentTerms,
            response.Status,
            response.Description,
            response.ClientName,
            response.ClientEmail,
            response.SenderAddress,
            response.ClientAddress,
            [
                .. response.Items.Select(item => new InvoiceItemPayload(
                    item.Name,
                    item.Quantity,
                    item.Price
                )),
            ]
        );

        var again = request.ToInvoice(original.Id).ToResponse();
        IReadOnlyList<InvoiceItemResponse> shared = [];

        Assert.Equal(response with { Items = shared }, again with { Items = shared });
        Assert.Equal(response.Items, again.Items);
    }

    [Fact]
    public void ComparesTwoIdenticalResponsesAsDifferentBecauseOfTheItemList()
    {
        var invoice = Sample.Invoice();

        Assert.NotEqual(invoice.ToResponse(), invoice.ToResponse());
    }
}
