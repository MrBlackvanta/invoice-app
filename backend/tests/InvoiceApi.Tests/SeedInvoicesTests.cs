namespace InvoiceApi.Tests;

public class SeedInvoicesTests
{
    static readonly List<Invoice> Seeded = SeedInvoices.All();

    [Fact]
    public void OffersTheSevenInvoicesTheDesignShows()
    {
        Assert.Equal(7, Seeded.Count);
    }

    [Fact]
    public void GivesEveryInvoiceADistinctId()
    {
        Assert.Equal(Seeded.Count, Seeded.Select(invoice => invoice.Id).Distinct().Count());
    }

    [Fact]
    public void GivesEveryInvoiceASixCharacterId()
    {
        Assert.All(Seeded, invoice => Assert.Equal(6, invoice.Id.Length));
    }

    [Fact]
    public void PassesItsOwnValidationRules()
    {
        Assert.All(Seeded, invoice => Assert.Empty(InvoiceRules.Check(invoice)));
    }

    [Fact]
    public void ArrivesWithItsTotalsAlreadyCalculated()
    {
        Assert.All(
            Seeded,
            invoice => Assert.Equal(invoice.Items.Sum(item => item.Total), invoice.Total)
        );
    }

    [Fact]
    public void ArrivesWithEachItemMultipliedOut()
    {
        Assert.All(
            Seeded,
            invoice =>
                Assert.All(
                    invoice.Items,
                    item => Assert.Equal(item.Quantity * item.Price, item.Total)
                )
        );
    }

    [Fact]
    public void ArrivesWithEveryPaymentDateDerivedFromItsTerms()
    {
        Assert.All(
            Seeded,
            invoice =>
                Assert.Equal(invoice.CreatedAt.AddDays(invoice.PaymentTerms), invoice.PaymentDue)
        );
    }

    [Fact]
    public void ArrivesWithEveryItemNumbered()
    {
        Assert.All(
            Seeded,
            invoice =>
                Assert.Equal(
                    [.. Enumerable.Range(0, invoice.Items.Count)],
                    invoice.Items.Select(item => item.Position)
                )
        );
    }

    [Fact]
    public void ShowsOffEveryStatusTheUiHasToRender()
    {
        var statuses = Seeded.Select(invoice => invoice.Status).ToHashSet();

        Assert.Contains(InvoiceStatus.Draft, statuses);
        Assert.Contains(InvoiceStatus.Pending, statuses);
        Assert.Contains(InvoiceStatus.Paid, statuses);
    }

    [Fact]
    public void OnlyUsesPaymentTermsTheFormOffers()
    {
        Assert.All(Seeded, invoice => Assert.Contains(invoice.PaymentTerms, (int[])[1, 7, 14, 30]));
    }

    [Fact]
    public void HandsBackAFreshListEachTimeSoCallersCannotCorruptIt()
    {
        Assert.NotSame(SeedInvoices.All(), SeedInvoices.All());
        Assert.NotSame(SeedInvoices.All()[0], SeedInvoices.All()[0]);
    }
}
