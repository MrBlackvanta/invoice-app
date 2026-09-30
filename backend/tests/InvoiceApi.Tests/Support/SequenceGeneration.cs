using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.ValueGeneration;

namespace InvoiceApi.Tests.Support;

public sealed class InvoiceNumbers : ValueGenerator<long>
{
    static long issued;

    public override bool GeneratesTemporaryValues => false;

    public override long Next(EntityEntry entry) => Interlocked.Increment(ref issued);
}

public sealed class ItemNumbers : ValueGenerator<int>
{
    static int issued;

    public override bool GeneratesTemporaryValues => false;

    public override int Next(EntityEntry entry) => Interlocked.Increment(ref issued);
}

public sealed class IdentityColumnsAreClientGenerated(ModelCustomizerDependencies dependencies)
    : RelationalModelCustomizer(dependencies)
{
    public override void Customize(ModelBuilder builder, DbContext context)
    {
        base.Customize(builder, context);

        var invoice = builder.Entity<Invoice>();

        invoice
            .Property(entity => entity.Sequence)
            .ValueGeneratedOnAdd()
            .HasValueGenerator<InvoiceNumbers>();

        invoice.OwnsMany(
            entity => entity.Items,
            items =>
                items.Property<int>("Id").ValueGeneratedOnAdd().HasValueGenerator<ItemNumbers>()
        );
    }
}
