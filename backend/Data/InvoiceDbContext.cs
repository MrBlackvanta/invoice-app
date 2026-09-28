using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : DbContext(options)
{
    const int IdLength = 6;
    const int StatusLength = 7;
    const int TextLength = 200;
    const int MoneyPrecision = 14;
    const int MoneyScale = 2;

    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        var invoice = builder.Entity<Invoice>();

        invoice.HasKey(entity => entity.Id);
        invoice.Property(entity => entity.Id).HasMaxLength(IdLength).IsFixedLength();
        invoice.Property(entity => entity.Sequence).ValueGeneratedOnAdd();
        invoice.HasIndex(entity => entity.Sequence).IsUnique();
        invoice.Property(entity => entity.Description).HasMaxLength(TextLength);
        invoice.Property(entity => entity.ClientName).HasMaxLength(TextLength);
        invoice.Property(entity => entity.ClientEmail).HasMaxLength(TextLength);
        invoice
            .Property(entity => entity.Status)
            .HasConversion(
                status => status.ToString().ToLowerInvariant(),
                text => Enum.Parse<InvoiceStatus>(text, true)
            )
            .HasMaxLength(StatusLength);
        invoice.Property(entity => entity.Total).HasPrecision(MoneyPrecision, MoneyScale);

        invoice.ComplexProperty(entity => entity.SenderAddress, Describe);
        invoice.ComplexProperty(entity => entity.ClientAddress, Describe);

        invoice.OwnsMany(
            entity => entity.Items,
            items =>
            {
                items.ToTable("invoice_items");
                items.Property(item => item.Name).HasMaxLength(TextLength);
                items.Property(item => item.Price).HasPrecision(MoneyPrecision, MoneyScale);
                items.Property(item => item.Total).HasPrecision(MoneyPrecision, MoneyScale);
            }
        );
    }

    static void Describe(ComplexPropertyBuilder<Address> address)
    {
        address.Property(value => value.Street).HasMaxLength(TextLength);
        address.Property(value => value.City).HasMaxLength(TextLength);
        address.Property(value => value.PostCode).HasMaxLength(TextLength);
        address.Property(value => value.Country).HasMaxLength(TextLength);
    }
}
