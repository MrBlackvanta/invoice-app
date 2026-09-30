using InvoiceApi.Tests.Support;

namespace InvoiceApi.Tests;

public class InvoiceTests
{
    [Theory]
    [InlineData(1, 2021, 8, 19)]
    [InlineData(7, 2021, 8, 25)]
    [InlineData(14, 2021, 9, 1)]
    [InlineData(30, 2021, 9, 17)]
    public void DatesThePaymentByTheTermsFromTheInvoiceDate(int terms, int year, int month, int day)
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = new DateOnly(2021, 8, 18);
        invoice.PaymentTerms = terms;

        invoice.Recalculate();

        Assert.Equal(new DateOnly(year, month, day), invoice.PaymentDue);
    }

    [Fact]
    public void CrossesAYearBoundary()
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = new DateOnly(2021, 12, 20);
        invoice.PaymentTerms = 30;

        invoice.Recalculate();

        Assert.Equal(new DateOnly(2022, 1, 19), invoice.PaymentDue);
    }

    [Fact]
    public void CrossesALeapDay()
    {
        var invoice = Sample.Invoice();
        invoice.CreatedAt = new DateOnly(2024, 2, 28);
        invoice.PaymentTerms = 1;

        invoice.Recalculate();

        Assert.Equal(new DateOnly(2024, 2, 29), invoice.PaymentDue);
    }

    [Fact]
    public void NumbersTheItemsByTheOrderTheyArrivedIn()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item("First"), Sample.Item("Second"), Sample.Item("Third")];

        invoice.Recalculate();

        Assert.Equal([0, 1, 2], invoice.Items.Select(item => item.Position));
    }

    [Fact]
    public void RenumbersTheItemsAfterOneIsRemoved()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item("First"), Sample.Item("Second"), Sample.Item("Third")];
        invoice.Recalculate();

        invoice.Items.RemoveAt(1);
        invoice.Recalculate();

        Assert.Equal([0, 1], invoice.Items.Select(item => item.Position));
    }

    [Fact]
    public void MultipliesEachItemOut()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(quantity: 3, price: 1800.90m)];

        invoice.Recalculate();

        Assert.Equal(5402.70m, invoice.Items.Single().Total);
    }

    [Fact]
    public void AddsTheItemsUpWithoutRoundingError()
    {
        var invoice = Sample.Invoice();
        invoice.Items =
        [
            Sample.Item(quantity: 1, price: 0.10m),
            Sample.Item(quantity: 1, price: 0.20m),
        ];

        invoice.Recalculate();

        Assert.Equal(0.30m, invoice.Total);
    }

    [Fact]
    public void TotalsAnEmptyInvoiceAtZero()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [];

        invoice.Recalculate();

        Assert.Equal(0m, invoice.Total);
    }

    [Fact]
    public void KeepsTwoDecimalPlacesOfPrecisionOnALargeTotal()
    {
        var invoice = Sample.Invoice();
        invoice.Items = [Sample.Item(quantity: 1000, price: 14002.33m)];

        invoice.Recalculate();

        Assert.Equal(14002330.00m, invoice.Total);
    }

    [Fact]
    public void IsIdempotent()
    {
        var invoice = Sample.Invoice();

        invoice.Recalculate();
        var once = invoice.Total;
        invoice.Recalculate();

        Assert.Equal(once, invoice.Total);
    }
}
