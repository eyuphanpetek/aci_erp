using ErpApi.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace ErpApi.Tests
{
    public class AuthServiceTests
    {
        private readonly AuthService _authService;
        private readonly Mock<IConfiguration> _mockConfiguration;

        public AuthServiceTests()
        {
            _mockConfiguration = new Mock<IConfiguration>();
            _authService = new AuthService(_mockConfiguration.Object);
        }

        [Fact]
        public void VerifyPassword_ValidPassword_ReturnsTrue()
        {
            // Arrange
            string password = "mysecretpassword";
            string hash = BCrypt.Net.BCrypt.HashPassword(password);

            // Act
            bool result = _authService.VerifyPassword(password, hash);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void VerifyPassword_InvalidPassword_ReturnsFalse()
        {
            // Arrange
            string password = "mysecretpassword";
            string wrongPassword = "wrongpassword";
            string hash = BCrypt.Net.BCrypt.HashPassword(password);

            // Act
            bool result = _authService.VerifyPassword(wrongPassword, hash);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void VerifyPassword_NullPassword_ThrowsArgumentNullException()
        {
            // Arrange
            string? password = null;
            string hash = BCrypt.Net.BCrypt.HashPassword("somepassword");

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _authService.VerifyPassword(password!, hash));
        }

        [Fact]
        public void VerifyPassword_NullHash_ThrowsArgumentNullException()
        {
            // Arrange
            string password = "somepassword";
            string? hash = null;

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _authService.VerifyPassword(password, hash!));
        }

        [Fact]
        public void VerifyPassword_InvalidHashFormat_ThrowsSaltParseException()
        {
            // Arrange
            string password = "somepassword";
            string invalidHash = "not-a-bcrypt-hash";

            // Act & Assert
            Assert.Throws<BCrypt.Net.SaltParseException>(() => _authService.VerifyPassword(password, invalidHash));
        }
    }
}
