using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Services;
using Xunit;

namespace ErpApi.Tests
{
    public class TariffServiceTests
    {
        [Fact]
        public async Task GetAllAsync_ReturnsAllTariffsOrderedBySortOrder()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new TariffService(context);

            // Act
            var tariffs = await service.GetAllAsync();

            // Assert
            Assert.Equal(6, tariffs.Count);
            
            // Verify sort order
            for (int i = 0; i < tariffs.Count - 1; i++)
            {
                Assert.True(tariffs[i].SortOrder <= tariffs[i + 1].SortOrder);
            }

            var traditional = tariffs.First(t => t.Id == 1);
            Assert.Equal("Geleneksel Soru", traditional.Name);
            Assert.Equal(175m, traditional.UnitPrice);
            Assert.Equal("soru", traditional.Unit);
        }

        [Fact]
        public async Task UpdateTariffPriceAsync_ValidId_UpdatesPrice()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new TariffService(context);

            // Act
            var updatedDto = await service.UpdateTariffPriceAsync(1, 250m);

            // Assert
            Assert.NotNull(updatedDto);
            Assert.Equal(1, updatedDto.Id);
            Assert.Equal(250m, updatedDto.UnitPrice);

            // Verify in DB
            var dbTariff = await context.TariffItems.FindAsync(1);
            Assert.NotNull(dbTariff);
            Assert.Equal(250m, dbTariff.UnitPrice);
        }

        [Fact]
        public async Task UpdateTariffPriceAsync_InvalidId_ReturnsNull()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new TariffService(context);

            // Act
            var result = await service.UpdateTariffPriceAsync(999, 250m);

            // Assert
            Assert.Null(result);
        }
    }
}
