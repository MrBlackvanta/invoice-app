public static class SeedInvoices
{
    public static List<Invoice> All()
    {
        List<Invoice> invoices =
        [
            new()
            {
                Id = "RT3080",
                CreatedAt = new DateOnly(2021, 8, 18),
                PaymentTerms = 1,
                Description = "Re-branding",
                ClientName = "Jensen Huang",
                ClientEmail = "jensenh@mail.com",
                Status = InvoiceStatus.Paid,
                SenderAddress = Sender(),
                ClientAddress = At(
                    "106 Kendell Street",
                    "Sharrington",
                    "NR24 5WQ",
                    "United Kingdom"
                ),
                Items = [Item("Brand Guidelines", 1, 1800.90m)],
            },
            new()
            {
                Id = "XM9141",
                CreatedAt = new DateOnly(2021, 8, 21),
                PaymentTerms = 30,
                Description = "Graphic Design",
                ClientName = "Alex Grim",
                ClientEmail = "alexgrim@mail.com",
                Status = InvoiceStatus.Pending,
                SenderAddress = Sender(),
                ClientAddress = At("84 Church Way", "Bradford", "BD1 9PB", "United Kingdom"),
                Items = [Item("Banner Design", 1, 156.00m), Item("Email Design", 2, 200.00m)],
            },
            new()
            {
                Id = "RG0314",
                CreatedAt = new DateOnly(2021, 9, 24),
                PaymentTerms = 7,
                Description = "Website Redesign",
                ClientName = "John Morrison",
                ClientEmail = "jm@myco.com",
                Status = InvoiceStatus.Paid,
                SenderAddress = Sender(),
                ClientAddress = At("79 Dover Road", "Westhall", "IP19 3PF", "United Kingdom"),
                Items = [Item("Website Redesign", 1, 14002.33m)],
            },
            new()
            {
                Id = "RT2080",
                CreatedAt = new DateOnly(2021, 10, 11),
                PaymentTerms = 1,
                Description = "Logo Concept",
                ClientName = "Alysa Werner",
                ClientEmail = "alysa@email.co.uk",
                Status = InvoiceStatus.Pending,
                SenderAddress = Sender(),
                ClientAddress = At("63 Warwick Road", "Carlisle", "CA20 2TG", "United Kingdom"),
                Items = [Item("Logo Sketches", 1, 102.04m)],
            },
            new()
            {
                Id = "AA1449",
                CreatedAt = new DateOnly(2021, 10, 7),
                PaymentTerms = 7,
                Description = "Re-branding",
                ClientName = "Mellisa Clarke",
                ClientEmail = "mellisa.clarke@example.com",
                Status = InvoiceStatus.Pending,
                SenderAddress = Sender(),
                ClientAddress = At("46 Abbey Row", "Cambridge", "CB5 6EG", "United Kingdom"),
                Items = [Item("New Logo", 1, 1532.33m), Item("Brand Guidelines", 1, 2500.00m)],
            },
            new()
            {
                Id = "TY9141",
                CreatedAt = new DateOnly(2021, 10, 1),
                PaymentTerms = 30,
                Description = "Landing Page Design",
                ClientName = "Thomas Wayne",
                ClientEmail = "thomas@dc.com",
                Status = InvoiceStatus.Pending,
                SenderAddress = Sender(),
                ClientAddress = At(
                    "3964  Queens Lane",
                    "Gotham",
                    "60457",
                    "United States of America"
                ),
                Items = [Item("Web Design", 1, 6155.91m)],
            },
            new()
            {
                Id = "FV2353",
                CreatedAt = new DateOnly(2021, 11, 5),
                PaymentTerms = 7,
                Description = "Logo Re-design",
                ClientName = "Anita Wainwright",
                Status = InvoiceStatus.Draft,
                SenderAddress = Sender(),
                Items = [Item("Logo Re-design", 1, 3102.04m)],
            },
        ];

        invoices.ForEach(invoice => invoice.Recalculate());

        return invoices;
    }

    static Address Sender() => At("19 Union Terrace", "London", "E1 3EZ", "United Kingdom");

    static Address At(string street, string city, string postCode, string country) =>
        new()
        {
            Street = street,
            City = city,
            PostCode = postCode,
            Country = country,
        };

    static InvoiceItem Item(string name, int quantity, decimal price) =>
        new()
        {
            Name = name,
            Quantity = quantity,
            Price = price,
        };
}
