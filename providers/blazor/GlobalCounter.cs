using Microsoft.Extensions.Logging;

public static class GlobalCounter
{
    private static int value;
    public static int Value => value;
    public static event Action<int>? Changed;

    public static void Increment(string instance, ILogger logger)
    {
        var next = Interlocked.Increment(ref value);
        logger.LogInformation("counter.increment provider=blazor instance={Instance} count={Count}", instance, next);
        Changed?.Invoke(next);
    }
}
