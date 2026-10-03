public static class InvoiceRules
{
    const string Required = "This field is required.";

    static readonly int[] AllowedTerms = [1, 7, 14, 30];
    static readonly DateOnly EarliestDate = new(1900, 1, 1);
    static readonly DateOnly LatestDate = new(2999, 12, 31);

    static readonly (string Field, Func<Invoice, string> Read)[] RequiredText =
    [
        ("senderStreet", invoice => invoice.SenderAddress.Street),
        ("senderCity", invoice => invoice.SenderAddress.City),
        ("senderPostCode", invoice => invoice.SenderAddress.PostCode),
        ("senderCountry", invoice => invoice.SenderAddress.Country),
        ("clientName", invoice => invoice.ClientName),
        ("clientEmail", invoice => invoice.ClientEmail),
        ("clientStreet", invoice => invoice.ClientAddress.Street),
        ("clientCity", invoice => invoice.ClientAddress.City),
        ("clientPostCode", invoice => invoice.ClientAddress.PostCode),
        ("clientCountry", invoice => invoice.ClientAddress.Country),
        ("description", invoice => invoice.Description),
    ];

    public static bool AllowsStart(InvoiceStatus status) =>
        status is InvoiceStatus.Draft or InvoiceStatus.Pending;

    public static bool AllowsMove(InvoiceStatus from, InvoiceStatus to) =>
        (from, to) switch
        {
            (InvoiceStatus.Draft, InvoiceStatus.Draft or InvoiceStatus.Pending) => true,
            (InvoiceStatus.Pending, InvoiceStatus.Pending or InvoiceStatus.Paid) => true,
            (InvoiceStatus.Paid, InvoiceStatus.Paid) => true,
            _ => false,
        };

    public static Dictionary<string, string[]> Check(Invoice invoice)
    {
        Dictionary<string, string[]> problems = [];

        if (invoice.CreatedAt < EarliestDate || invoice.CreatedAt > LatestDate)
        {
            problems["createdAt"] = ["An invoice date between 1900 and 2999 is required."];
        }

        if (!AllowedTerms.Contains(invoice.PaymentTerms))
        {
            problems["paymentTerms"] = ["Payment terms must be 1, 7, 14 or 30 days."];
        }

        foreach (var (position, item) in invoice.Items.Index())
        {
            if (item.Quantity < 0)
            {
                problems[$"items.{position}.quantity"] = ["Quantity cannot be negative."];
            }

            if (item.Price < 0)
            {
                problems[$"items.{position}.price"] = ["Price cannot be negative."];
            }
        }

        if (invoice.Status == InvoiceStatus.Draft)
        {
            return problems;
        }

        foreach (var (field, read) in RequiredText)
        {
            if (read(invoice).Length == 0)
            {
                problems[field] = [Required];
            }
        }

        if (invoice.Items.Count == 0)
        {
            problems["addItem"] = ["An invoice needs at least one item."];
        }

        foreach (var (position, item) in invoice.Items.Index())
        {
            if (item.Name.Length == 0)
            {
                problems[$"items.{position}.name"] = [Required];
            }
        }

        return problems;
    }
}
