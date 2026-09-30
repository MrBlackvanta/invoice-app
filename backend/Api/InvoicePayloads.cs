public record AddressPayload(string Street, string City, string PostCode, string Country);

public record InvoiceItemPayload(string Name, int Quantity, decimal Price);

public record InvoiceRequest(
    DateOnly CreatedAt,
    int PaymentTerms,
    InvoiceStatus Status,
    string? Description,
    string? ClientName,
    string? ClientEmail,
    AddressPayload? SenderAddress,
    AddressPayload? ClientAddress,
    IReadOnlyList<InvoiceItemPayload>? Items
);

public record StatusRequest(InvoiceStatus Status);

public record InvoiceItemResponse(string Name, int Quantity, decimal Price, decimal Total);

public record InvoiceResponse(
    string Id,
    DateOnly CreatedAt,
    DateOnly PaymentDue,
    int PaymentTerms,
    InvoiceStatus Status,
    string Description,
    string ClientName,
    string ClientEmail,
    AddressPayload SenderAddress,
    AddressPayload ClientAddress,
    IReadOnlyList<InvoiceItemResponse> Items,
    decimal Total
);
