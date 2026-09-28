public class Invoice
{
    public long Sequence { get; set; }
    public required string Id { get; set; }
    public DateOnly CreatedAt { get; set; }
    public DateOnly PaymentDue { get; set; }
    public int PaymentTerms { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public InvoiceStatus Status { get; set; }
    public Address SenderAddress { get; set; } = new();
    public Address ClientAddress { get; set; } = new();
    public List<InvoiceItem> Items { get; set; } = [];
    public decimal Total { get; set; }

    public void Recalculate()
    {
        PaymentDue = CreatedAt.AddDays(PaymentTerms);

        foreach (var (position, item) in Items.Index())
        {
            item.Position = position;
            item.Total = item.Quantity * item.Price;
        }

        Total = Items.Sum(item => item.Total);
    }
}
