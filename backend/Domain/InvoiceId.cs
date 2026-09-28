public static class InvoiceId
{
    const string Letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const int Digits = 10000;

    public static string Next() => $"{Letter()}{Letter()}{Random.Shared.Next(Digits):D4}";

    static char Letter() => Letters[Random.Shared.Next(Letters.Length)];
}
