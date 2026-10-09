using Microsoft.Extensions.Configuration;
using Npgsql;

namespace InvoiceApi.Tests;

public class DatabaseConnectionTests
{
    const string Uri = "postgresql://reader:hunter2@db.example.test:6543/postgres";

    static IConfiguration Configured(string? value) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["ConnectionStrings:Default"] = value }
            )
            .Build();

    static NpgsqlConnectionStringBuilder Resolve(string? value) =>
        new(DatabaseConnection.Resolve(Configured(value)));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\"\"")]
    public void RefusesToStartWithoutAConnectionString(string? value)
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            DatabaseConnection.Resolve(Configured(value))
        );

        Assert.Contains("is not set", error.Message);
    }

    [Fact]
    public void ExplainsTheExpectedShapeWhenItIsMissing()
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            DatabaseConnection.Resolve(Configured(null))
        );

        Assert.Contains("session pooler URI", error.Message);
    }

    [Fact]
    public void RefusesAValueThatIsNeitherUriNorKeyValue()
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            DatabaseConnection.Resolve(Configured("just-a-hostname"))
        );

        Assert.Contains("neither a URI nor a key-value", error.Message);
    }

    [Fact]
    public void PassesAKeyValueConnectionStringStraightThrough()
    {
        const string native = "Host=db.example.test;Database=postgres;Username=reader";

        Assert.Equal(native, DatabaseConnection.Resolve(Configured(native)));
    }

    [Fact]
    public void ExpandsAUriIntoTheFormNpgsqlUnderstands()
    {
        var built = Resolve(Uri);

        Assert.Equal("db.example.test", built.Host);
        Assert.Equal(6543, built.Port);
        Assert.Equal("postgres", built.Database);
        Assert.Equal("reader", built.Username);
    }

    [Theory]
    [InlineData("postgres://reader:hunter2@db.example.test:6543/postgres")]
    [InlineData("POSTGRESQL://reader:hunter2@db.example.test:6543/postgres")]
    [InlineData("PostgreS://reader:hunter2@db.example.test:6543/postgres")]
    public void AcceptsBothSchemesInAnyCase(string value)
    {
        Assert.Equal("db.example.test", Resolve(value).Host);
    }

    [Fact]
    public void FallsBackToThePostgresDefaultPort()
    {
        Assert.Equal(5432, Resolve("postgresql://reader:hunter2@db.example.test/postgres").Port);
    }

    [Fact]
    public void UnwrapsAValueThatArrivedWrappedInQuotes()
    {
        Assert.Equal("db.example.test", Resolve($"\"{Uri}\"").Host);
    }

    [Fact]
    public void UnwrapsAValueThatArrivedWrappedInApostrophes()
    {
        Assert.Equal("db.example.test", Resolve($"'{Uri}'").Host);
    }

    [Fact]
    public void TrimsSurroundingWhitespace()
    {
        Assert.Equal("db.example.test", Resolve($"  {Uri}  ").Host);
    }

    [Fact]
    public void DecodesAPercentEncodedPassword()
    {
        var built = Resolve("postgresql://reader:p%40ss%3Aword@db.example.test:6543/postgres");

        Assert.Equal("p@ss:word", built.Password);
    }

    [Fact]
    public void DecodesAPercentEncodedUsername()
    {
        var built = Resolve("postgresql://read%40er:hunter2@db.example.test:6543/postgres");

        Assert.Equal("read@er", built.Username);
    }

    [Fact]
    public void CarriesNoPasswordWhenTheUriHasNone()
    {
        var built = Resolve("postgresql://reader@db.example.test:6543/postgres");

        Assert.Equal("reader", built.Username);
        Assert.True(string.IsNullOrEmpty(built.Password));
    }

    [Fact]
    public void AlwaysRequiresTls()
    {
        Assert.Equal(SslMode.Require, Resolve(Uri).SslMode);
    }

    [Fact]
    public void CapsThePoolSoAFreePoolerIsNotExhausted()
    {
        Assert.Equal(4, Resolve(Uri).MaxPoolSize);
    }

    [Fact]
    public void ReleasesIdleConnectionsBackToTheSharedPooler()
    {
        Assert.Equal(60, Resolve(Uri).ConnectionIdleLifetime);
    }
}
