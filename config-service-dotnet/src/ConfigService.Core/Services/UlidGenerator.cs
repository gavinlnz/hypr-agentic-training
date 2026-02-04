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
        var resultIndex = 0;

        // Process bytes in groups to create base32 encoding
        for (var i = 0; i < bytes.Length; i += 5)
        {
            var group = new byte[5];
            var groupSize = Math.Min(5, bytes.Length - i);
            Array.Copy(bytes, i, group, 0, groupSize);

            // Pad with zeros if needed
            for (var j = groupSize; j < 5; j++)
            {
                group[j] = 0;
            }

            // Convert 5 bytes (40 bits) to 8 base32 characters
            var value = ((long)group[0] << 32) |
                       ((long)group[1] << 24) |
                       ((long)group[2] << 16) |
                       ((long)group[3] << 8) |
                       group[4];

            // Extract 8 base32 characters (5 bits each)
            var charsToWrite = Math.Min(8, 26 - resultIndex);
            for (var j = 0; j < charsToWrite && resultIndex < 26; j++)
            {
                var charIndex = (int)((value >> (35 - j * 5)) & 0x1F);
                result[resultIndex++] = Base32Chars[charIndex];
            }
        }

        return new string(result);
    }
}