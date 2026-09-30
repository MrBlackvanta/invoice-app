using System.Net;
using InvoiceApi.Tests.Support;

namespace InvoiceApi.Tests;

public class RateLimitedApiFactory : InvoiceApiFactory
{
    protected override bool LimitsRequests => true;
}

public class RateLimitTests(RateLimitedApiFactory factory) : IClassFixture<RateLimitedApiFactory>
{
    const int Allowance = 60;

    [Fact]
    public async Task TurnsAwayABurstBeyondTheMinuteAllowanceButKeepsAnsweringHealthChecks()
    {
        factory.Reset();
        var client = factory.CreateClient();

        var answers = new List<HttpStatusCode>();

        for (var attempt = 0; attempt <= Allowance; attempt++)
        {
            answers.Add((await client.GetAsync("/invoices")).StatusCode);
        }

        Assert.Equal(HttpStatusCode.OK, answers[0]);
        Assert.Equal(HttpStatusCode.OK, answers[Allowance - 1]);
        Assert.Equal(HttpStatusCode.TooManyRequests, answers[Allowance]);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
    }
}
