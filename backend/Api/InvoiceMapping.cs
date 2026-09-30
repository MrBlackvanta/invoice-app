public static class InvoiceMapping
{
    public static Invoice ToInvoice(this InvoiceRequest request, string id)
    {
        var invoice = new Invoice { Id = id };

        request.ApplyTo(invoice);

        return invoice;
    }

    public static void ApplyTo(this InvoiceRequest request, Invoice invoice)
    {
        invoice.CreatedAt = request.CreatedAt;
        invoice.PaymentTerms = request.PaymentTerms;
        invoice.Status = request.Status;
        invoice.Description = Text(request.Description);
        invoice.ClientName = Text(request.ClientName);
        invoice.ClientEmail = Text(request.ClientEmail);
        invoice.SenderAddress = ToAddress(request.SenderAddress);
        invoice.ClientAddress = ToAddress(request.ClientAddress);
        invoice.Items =
        [
            .. (request.Items ?? []).Select(item => new InvoiceItem
            {
                Name = Text(item.Name),
                Quantity = item.Quantity,
                Price = item.Price,
            }),
        ];

        invoice.Recalculate();
    }

    public static InvoiceResponse ToResponse(this Invoice invoice) =>
        new(
            invoice.Id,
            invoice.CreatedAt,
            invoice.PaymentDue,
            invoice.PaymentTerms,
            invoice.Status,
            invoice.Description,
            invoice.ClientName,
            invoice.ClientEmail,
            ToPayload(invoice.SenderAddress),
            ToPayload(invoice.ClientAddress),
            [
                .. invoice
                    .Items.OrderBy(item => item.Position)
                    .Select(item => new InvoiceItemResponse(
                        item.Name,
                        item.Quantity,
                        item.Price,
                        item.Total
                    )),
            ],
            invoice.Total
        );

    static string Text(string? value) => value?.Trim() ?? string.Empty;

    static Address ToAddress(AddressPayload? payload) =>
        new()
        {
            Street = Text(payload?.Street),
            City = Text(payload?.City),
            PostCode = Text(payload?.PostCode),
            Country = Text(payload?.Country),
        };

    static AddressPayload ToPayload(Address address) =>
        new(address.Street, address.City, address.PostCode, address.Country);
}
