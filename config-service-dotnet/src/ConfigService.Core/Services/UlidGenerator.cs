namespace ConfigService.Core.Services;

/// <summary>
/// ULID (Universally Unique Lexicographically Sortable Identifier) generator
/// Implementation based on the ULID specification
/// </summary>
public static class UlidGenerator
{
    private static readonly char[] Base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".ToCharArray();
    private static readonly Random Random = new();
    private static readonly object Lock = new();

    /// <summary>
    /// Generate a new ULID
    /// </summary>
    public static string NewUlid()
    {
        return NewUlid(DateTimeOffset.UtcNow);
    }

    /// <summary>
    /// Generate a new ULID with a specific timestamp
    /// </summary>
    public static string NewUlid(DateTimeOffset timestamp)
    {
        var timestampMs = timestamp.ToUnixTimeMilliseconds();
        var timestampBytes = BitConverter.GetBytes(timestampMs);
        
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(timestampBytes);
        }

        // Generate 10 random bytes
        var randomBytes = new byte[10];
        lock (Lock)
        {
            Random.NextBytes(randomBytes);
        }

        // Combine timestamp (6 bytes) and random (10 bytes) = 16 bytes total
        var ulidBytes = new byte[16];
        Array.Copy(timestampBytes, 2, ulidBytes, 0, 6); // Use last 6 bytes of timestamp
        Array.Copy(randomBytes, 0, ulidBytes, 6, 10);

        return EncodeBase32(ulidBytes);
    }

    private static string EncodeBase32(byte[] bytes)
    {
        var result = new char[26]; // ULID is always 26 characters
        var index = 0;

        // Process 5 bytes at a time to get 8 base32 characters
        for (var i = 0; i < bytes.Length; i += 5)
        {
            var chunk = new byte[5];
            var chunkSize = Math.Min(5, bytes.Length - i);
            Array.Copy(bytes, i, chunk, 0, chunkSize);

            // Convert 5 bytes (40 bits) to 8 base32 characters
            var value = 0UL;
            for (var j = 0; j < chunkSize; j++)
            {
                value = (value << 8) | chunk[j];
            }

            var charCount = (chunkSize * 8 + 4) / 5; // Calculate number of base32 chars needed
            for (var j = charCount - 1; j >= 0; j--)
            {
                if (index < result.Length)
                {
                    result[index++] = Base32Chars[value & 0x1F];
                    value >>= 5;
                }
            }
        }

        // Reverse the result since we built it backwards
        Array.Reverse(result);
        return new string(result);
    }
}