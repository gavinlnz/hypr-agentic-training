using ConfigService.Core.Services;
using FluentAssertions;
using Xunit;
using System.Text.RegularExpressions;

namespace ConfigService.Tests.Core.Services;

public class UlidGeneratorTests
{
    private static readonly Regex UlidRegex = new(@"^[0-9A-HJKMNP-TV-Z]{26}$", RegexOptions.Compiled);

    [Fact]
    public void NewUlid_ShouldGenerateValidUlid()
    {
        // Act
        var ulid = UlidGenerator.NewUlid();

        // Assert
        ulid.Should().NotBeNullOrEmpty();
        ulid.Should().HaveLength(26);
        UlidRegex.IsMatch(ulid).Should().BeTrue();
    }

    [Fact]
    public void NewUlid_ShouldGenerateUniqueValues()
    {
        // Act
        var ulids = new HashSet<string>();
        for (int i = 0; i < 1000; i++)
        {
            ulids.Add(UlidGenerator.NewUlid());
        }

        // Assert
        ulids.Should().HaveCount(1000, "all generated ULIDs should be unique");
    }

    [Fact]
    public void NewUlid_WithTimestamp_ShouldGenerateValidUlid()
    {
        // Arrange
        var timestamp = DateTimeOffset.UtcNow.AddDays(-1);

        // Act
        var ulid = UlidGenerator.NewUlid(timestamp);

        // Assert
        ulid.Should().NotBeNullOrEmpty();
        ulid.Should().HaveLength(26);
        UlidRegex.IsMatch(ulid).Should().BeTrue();
    }

    [Fact]
    public void NewUlid_WithSameTimestamp_ShouldGenerateDifferentValues()
    {
        // Arrange
        var timestamp = DateTimeOffset.UtcNow;

        // Act
        var ulid1 = UlidGenerator.NewUlid(timestamp);
        var ulid2 = UlidGenerator.NewUlid(timestamp);

        // Assert
        ulid1.Should().NotBe(ulid2, "ULIDs with same timestamp should still be unique due to random component");
    }

    [Fact]
    public void NewUlid_WithDifferentTimestamps_ShouldBeLexicographicallySorted()
    {
        // Arrange
        var earlierTime = DateTimeOffset.UtcNow.AddMinutes(-1);
        var laterTime = DateTimeOffset.UtcNow;

        // Act
        var earlierUlid = UlidGenerator.NewUlid(earlierTime);
        var laterUlid = UlidGenerator.NewUlid(laterTime);

        // Assert
        string.Compare(earlierUlid, laterUlid, StringComparison.Ordinal)
            .Should().BeLessThan(0, "earlier ULID should be lexicographically smaller");
    }
}