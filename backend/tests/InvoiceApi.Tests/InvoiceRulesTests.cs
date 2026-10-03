using InvoiceApi.Tests.Support;

namespace InvoiceApi.Tests;

public class InvoiceRulesTests
{
    [Fact]
    public void AcceptsACompletePendingInvoice()
    {
        Assert.Empty(InvoiceRules.Check(Sample.Invoice()));
    }

    [Fact]
    public void AcceptsACompletePaidInvoice()
    {
        Assert.Empty(InvoiceRules.Check(Sample.Invoice(InvoiceStatus.Paid)));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(14)]
    [InlineData(30)]
    public void AcceptsEveryOfferedPaymentTerm(int days)
    {
        var invoice = Sample.Invoice();
        invoice.PaymentTerms = days;

        Assert.Empty(InvoiceRules.Check(invoice));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2)]
    [InlineData(15)]
    [InlineData(31)]
    [InlineData(-7)]
    public void RejectsAPaymentTermThatIsNotOffered(int days)
    {
        var invoice = Sample.Invoice();
        invoice.PaymentTerms = days;

        Assert.Contains("paymentTerms", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RejectsAPaymentTermEvenOnADraft()
    {
        var invoice = Sample.Invoice(InvoiceStatus.Draft);
        invoice.PaymentTerms = 99;

        Assert.Contains("paymentTerms", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RejectsADateBeforeNineteenHundred()
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = new DateOnly(1899, 12, 31);

        Assert.Contains("createdAt", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RejectsADateAfterTwentyNineNinetyNine()
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = new DateOnly(3000, 1, 1);

        Assert.Contains("createdAt", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RejectsAMissingDate()
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = default;

        Assert.Contains("createdAt", InvoiceRules.Check(invoice));
    }

    [Theory]
    [InlineData(1900, 1, 1)]
    [InlineData(2999, 12, 31)]
    public void AcceptsTheBoundaryDates(int year, int month, int day)
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = new DateOnly(year, month, day);

        Assert.DoesNotContain("createdAt", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RejectsANegativeQuantity()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(quantity: -1)];

        Assert.Contains("items.0.quantity", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RejectsANegativePrice()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(price: -0.01m)];

        Assert.Contains("items.0.price", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void AcceptsAZeroQuantityAndPrice()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(quantity: 0, price: 0m)];

        Assert.Empty(InvoiceRules.Check(invoice));
    }

    [Fact]
    public void NamesTheOffendingItemByPosition()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(), Sample.Item(quantity: -2), Sample.Item()];

        var problems = InvoiceRules.Check(invoice);

        Assert.Contains("items.1.quantity", problems);
        Assert.DoesNotContain("items.0.quantity", problems);
        Assert.DoesNotContain("items.2.quantity", problems);
    }

    [Fact]
    public void RejectsANegativeQuantityEvenOnADraft()
    {
        var invoice = Sample.Invoice(InvoiceStatus.Draft);
        invoice.Items = [Sample.Item(quantity: -1)];

        Assert.Contains("items.0.quantity", InvoiceRules.Check(invoice));
    }

    [Theory]
    [InlineData("senderStreet")]
    [InlineData("senderCity")]
    [InlineData("senderPostCode")]
    [InlineData("senderCountry")]
    [InlineData("clientStreet")]
    [InlineData("clientCity")]
    [InlineData("clientPostCode")]
    [InlineData("clientCountry")]
    [InlineData("clientName")]
    [InlineData("clientEmail")]
    [InlineData("description")]
    public void RequiresEveryTextFieldOnAPendingInvoice(string field)
    {
        var invoice = Sample.Invoice();
        Blank(invoice, field);

        var problems = InvoiceRules.Check(invoice);

        Assert.Contains(field, problems);
        Assert.Equal("This field is required.", problems[field].Single());
    }

    [Theory]
    [InlineData("senderStreet")]
    [InlineData("clientName")]
    [InlineData("description")]
    public void RequiresNoTextFieldOnADraft(string field)
    {
        var invoice = Sample.Invoice(InvoiceStatus.Draft);
        Blank(invoice, field);

        Assert.DoesNotContain(field, InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RequiresAtLeastOneItemOnAPendingInvoice()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [];

        Assert.Contains("addItem", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void AllowsADraftWithNoItems()
    {
        var invoice = Sample.Invoice(InvoiceStatus.Draft);
        invoice.Items = [];

        Assert.Empty(InvoiceRules.Check(invoice));
    }

    [Fact]
    public void RequiresAnItemNameOnAPendingInvoice()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(name: "")];

        Assert.Contains("items.0.name", InvoiceRules.Check(invoice));
    }

    [Fact]
    public void AllowsAnUnnamedItemOnADraft()
    {
        var invoice = Sample.Invoice(InvoiceStatus.Draft);
        invoice.Items = [Sample.Item(name: "")];

        Assert.Empty(InvoiceRules.Check(invoice));
    }

    [Fact]
    public void AcceptsAnEntirelyEmptyDraft()
    {
        var invoice = new Invoice
        {
            Id = "AB1234",
            CreatedAt = new DateOnly(2021, 8, 18),
            PaymentTerms = 30,
            Status = InvoiceStatus.Draft,
        };

        Assert.Empty(InvoiceRules.Check(invoice));
    }

    [Fact]
    public void ReportsEveryProblemAtOnceRatherThanTheFirst()
    {
        var invoice = new Invoice
        {
            Id = "AB1234",
            Status = InvoiceStatus.Pending,
            PaymentTerms = 99,
        };

        var problems = InvoiceRules.Check(invoice);

        Assert.Contains("createdAt", problems);
        Assert.Contains("paymentTerms", problems);
        Assert.Contains("clientName", problems);
        Assert.Contains("addItem", problems);
    }

    [Theory]
    [InlineData(InvoiceStatus.Draft)]
    [InlineData(InvoiceStatus.Pending)]
    public void StartsAnInvoiceAsADraftOrAsPending(InvoiceStatus status)
    {
        Assert.True(InvoiceRules.AllowsStart(status));
    }

    [Fact]
    public void WillNotStartAnInvoiceThatIsAlreadyPaid()
    {
        Assert.False(InvoiceRules.AllowsStart(InvoiceStatus.Paid));
    }

    [Theory]
    [InlineData(InvoiceStatus.Draft, InvoiceStatus.Pending)]
    [InlineData(InvoiceStatus.Pending, InvoiceStatus.Paid)]
    public void MovesAnInvoiceForwardOneStep(InvoiceStatus from, InvoiceStatus to)
    {
        Assert.True(InvoiceRules.AllowsMove(from, to));
    }

    [Theory]
    [InlineData(InvoiceStatus.Draft)]
    [InlineData(InvoiceStatus.Pending)]
    [InlineData(InvoiceStatus.Paid)]
    public void AcceptsTheStatusAnInvoiceAlreadyHas(InvoiceStatus status)
    {
        Assert.True(InvoiceRules.AllowsMove(status, status));
    }

    [Fact]
    public void WillNotPayAnInvoiceThatWasNeverSent()
    {
        Assert.False(InvoiceRules.AllowsMove(InvoiceStatus.Draft, InvoiceStatus.Paid));
    }

    [Theory]
    [InlineData(InvoiceStatus.Pending, InvoiceStatus.Draft)]
    [InlineData(InvoiceStatus.Paid, InvoiceStatus.Pending)]
    [InlineData(InvoiceStatus.Paid, InvoiceStatus.Draft)]
    public void WillNotMoveAnInvoiceBackwards(InvoiceStatus from, InvoiceStatus to)
    {
        Assert.False(InvoiceRules.AllowsMove(from, to));
    }

    static void Blank(Invoice invoice, string field)
    {
        switch (field)
        {
            case "senderStreet":
                invoice.SenderAddress.Street = "";
                break;
            case "senderCity":
                invoice.SenderAddress.City = "";
                break;
            case "senderPostCode":
                invoice.SenderAddress.PostCode = "";
                break;
            case "senderCountry":
                invoice.SenderAddress.Country = "";
                break;
            case "clientStreet":
                invoice.ClientAddress.Street = "";
                break;
            case "clientCity":
                invoice.ClientAddress.City = "";
                break;
            case "clientPostCode":
                invoice.ClientAddress.PostCode = "";
                break;
            case "clientCountry":
                invoice.ClientAddress.Country = "";
                break;
            case "clientName":
                invoice.ClientName = "";
                break;
            case "clientEmail":
                invoice.ClientEmail = "";
                break;
            case "description":
                invoice.Description = "";
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(field), field, "Unknown field");
        }
    }
}
