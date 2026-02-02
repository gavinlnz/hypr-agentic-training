using ConfigService.Core.Models;
using FluentAssertions;
using Xunit;

namespace ConfigService.Tests.Core.Models;

public class ApplicationTests
{
    [Theory]
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FAV", true)]
    [InlineData("01BX5ZZKBKACTAV9WEVGEMMVRZ", true)]
    [InlineData("invalid-ulid", false)]
    [InlineData("", false)]
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FA", false)] // Too short
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FAVV", false)] // Too long
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FAU", false)] // Contains 'U'
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FAI", false)] // Contains 'I'
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FAL", false)] // Contains 'L'
    [InlineData("01ARZ3NDEKTSV4RRFFQ69G5FAO", false)] // Contains 'O'
    public void IsValidUlid_ShouldValidateCorrectly(string ulid, bool expected)
    {
        // Act & Assert
        Application.IsValidUlid(ulid).Should().Be(expected);
    }

    [Fact]
    public void Application_IsValidUlid_ShouldValidateInstanceId()
    {
        // Arrange
        var application = new Application { Id = "01ARZ3NDEKTSV4RRFFQ69G5FAV" };

        // Act & Assert
        application.IsValidUlid().Should().BeTrue();
    }

    [Fact]
    public void ApplicationWithConfigs_AreConfigurationIdsValid_ShouldValidateAllIds()
    {
        // Arrange
        var application = new ApplicationWithConfigs
        {
            ConfigurationIds = new List<string>
            {
                "01ARZ3NDEKTSV4RRFFQ69G5FAV",
                "01BX5ZZKBKACTAV9WEVGEMMVRZ"
            }
        };

        // Act & Assert
        application.AreConfigurationIdsValid().Should().BeTrue();
    }

    [Fact]
    public void ApplicationWithConfigs_AreConfigurationIdsValid_ShouldReturnFalseForInvalidIds()
    {
        // Arrange
        var application = new ApplicationWithConfigs
        {
            ConfigurationIds = new List<string>
            {
                "01ARZ3NDEKTSV4RRFFQ69G5FAV",
                "invalid-ulid"
            }
        };

        // Act & Assert
        application.AreConfigurationIdsValid().Should().BeFalse();
    }

    [Fact]
    public void ApplicationWithConfigs_AreConfigurationIdsValid_ShouldReturnTrueForEmptyList()
    {
        // Arrange
        var application = new ApplicationWithConfigs
        {
            ConfigurationIds = new List<string>()
        };

        // Act & Assert
        application.AreConfigurationIdsValid().Should().BeTrue();
    }
}