namespace InvoiceApi.Tests.Support;

public static class Sample
{
    public static Address Address() =>
        new()
        {
            Street = "19 Union Terrace",
            City = "London",
            PostCode = "E1 3EZ",
            Country = "United Kingdom",
        };

    public static InvoiceItem Item(
        string name = "Brand Guidelines",
        int quantity = 1,
        decimal price = 1800.90m
    ) =>
        new()
        {
            Name = name,
            Quantity = quantity,
            Price = price,
            Total = quantity * price,
        };

    public static Invoice Invoice(InvoiceStatus status = InvoiceStatus.Pending)
    {
        var invoice = new Invoice
        {
            Id = "RT3080",
            CreatedAt = new DateOnly(2021, 8, 18),
            PaymentTerms = 30,
            Description = "Re-branding",
            ClientName = "Jensen Huang",
            ClientEmail = "jensenh@mail.com",
            Status = status,
            SenderAddress = Address(),
            ClientAddress = Address(),
            Items = [Item()],
        };

        invoice.Recalculate();

        return invoice;
    }

    public static AddressPayload AddressPayload() =>
        new("19 Union Terrace", "London", "E1 3EZ", "United Kingdom");

    public static InvoiceRequest Request(
        InvoiceStatus status = InvoiceStatus.Pending,
        DateOnly? createdAt = null,
        int paymentTerms = 30,
        IReadOnlyList<InvoiceItemPayload>? items = null
    ) =>
        new(
            createdAt ?? new DateOnly(2021, 8, 18),
            paymentTerms,
            status,
            "Re-branding",
            "Jensen Huang",
            "jensenh@mail.com",
            AddressPayload(),
            AddressPayload(),
            items ?? [new InvoiceItemPayload("Brand Guidelines", 1, 1800.90m)]
        );
}
