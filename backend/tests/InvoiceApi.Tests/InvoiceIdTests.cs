using System.Text.RegularExpressions;

namespace InvoiceApi.Tests;

public partial class InvoiceIdTests
{
    [GeneratedRegex("^[A-Z]{2}[0-9]{4}$")]
    private static partial Regex Shape();

    [Fact]
    public void IsSixCharactersLong()
    {
        Assert.Equal(6, InvoiceId.Next().Length);
    }

    [Fact]
    public void IsTwoLettersFollowedByFourDigits()
    {
        Assert.Matches(Shape(), InvoiceId.Next());
    }

    [Fact]
    public void KeepsThatShapeAcrossManyDraws()
    {
        for (var draw = 0; draw < 5_000; draw++)
        {
            Assert.Matches(Shape(), InvoiceId.Next());
        }
    }

    [Fact]
    public void PadsSmallNumbersRatherThanShorteningTheId()
    {
        var ids = Enumerable.Range(0, 20_000).Select(_ => InvoiceId.Next()).ToList();

        Assert.All(ids, id => Assert.Equal(6, id.Length));
        Assert.Contains(ids, id => id.EndsWith('0') && id[2] == '0');
    }

    [Fact]
    public void DoesNotReturnTheSameIdEveryTime()
    {
        var ids = Enumerable.Range(0, 100).Select(_ => InvoiceId.Next()).ToHashSet();

        Assert.True(ids.Count > 50, $"Expected varied ids, got {ids.Count} distinct of 100");
    }

    [Fact]
    public void ReachesBothEndsOfTheAlphabet()
    {
        var letters = Enumerable.Range(0, 20_000).Select(_ => InvoiceId.Next()[0]).ToHashSet();

        Assert.Equal(26, letters.Count);
    }
}
