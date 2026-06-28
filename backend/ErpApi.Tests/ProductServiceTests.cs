using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Services;
using Xunit;

namespace ErpApi.Tests
{
    public class ProductServiceTests
    {
        [Fact]
        public async Task CreateProductAsync_ValidCategory_CreatesProductAndAutoSeedsBranches()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var productDto = await service.CreateProductAsync("Yeni SB", 1);

            // Assert
            Assert.NotNull(productDto);
            Assert.Equal("Yeni SB", productDto.Name);
            Assert.Equal(1, productDto.CategoryId);
            Assert.Equal(3, productDto.Id); // 1 and 2 are seeded, so this should be 3

            // Verify that the standard default branches ("Matematik" and "Fizik" exist in seeded branches)
            // were auto-seeded for this new product.
            var productBranches = await context.ProductBranches
                .Where(pb => pb.ProductId == productDto.Id)
                .Include(pb => pb.Branch)
                .ToListAsync();

            Assert.Equal(2, productBranches.Count);
            Assert.Contains(productBranches, pb => pb.Branch.Name == "Matematik");
            Assert.Contains(productBranches, pb => pb.Branch.Name == "Fizik");

            // Verify that publication tasks were auto-initialized
            var taskCount = await context.PublicationTasks
                .CountAsync(t => productBranches.Select(pb => pb.Id).Contains(t.ProductBranchId));
            Assert.Equal(2, taskCount);
        }

        [Fact]
        public async Task CreateProductAsync_InvalidCategory_ReturnsNull()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var productDto = await service.CreateProductAsync("Yeni SB", 999); // Invalid Category

            // Assert
            Assert.Null(productDto);
        }

        [Fact]
        public async Task CreateProductAsync_ExistingProductsInCategory_SetsCorrectSortOrder()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();

            var category = new Category { Name = "Test Category" };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            context.Products.AddRange(
                new Product { Name = "Product 1", CategoryId = category.Id, SortOrder = 5 },
                new Product { Name = "Product 2", CategoryId = category.Id, SortOrder = 10 }
            );
            await context.SaveChangesAsync();

            var service = new ProductService(context);

            // Act
            var result = await service.CreateProductAsync("New Product", category.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(11, result.SortOrder); // Max (10) + 1
        }

        [Fact]
        public async Task DeleteProductAsync_ValidId_DeletesProduct()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var deleted = await service.DeleteProductAsync(1);

            // Assert
            Assert.True(deleted);
            var dbProduct = await context.Products.FindAsync(1);
            Assert.Null(dbProduct);
        }

        [Fact]
        public async Task DeleteProductAsync_InvalidId_ReturnsFalse()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var deleted = await service.DeleteProductAsync(999);

            // Assert
            Assert.False(deleted);
        }

        [Fact]
        public async Task AddBranchToProductAsync_NewBranchName_CreatesBranchAndMapsIt()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var branchDto = await service.AddBranchToProductAsync(1, "Kimya");

            // Assert
            Assert.NotNull(branchDto);
            Assert.Equal("Kimya", branchDto.Name);

            // Verify branch was created in DB
            var dbBranch = await context.Branches.FirstOrDefaultAsync(b => b.Name == "Kimya");
            Assert.NotNull(dbBranch);

            // Verify it was mapped to Product 1
            var dbMapping = await context.ProductBranches
                .FirstOrDefaultAsync(pb => pb.ProductId == 1 && pb.BranchId == dbBranch.Id);
            Assert.NotNull(dbMapping);

            // Verify PublicationTask was initialized
            var task = await context.PublicationTasks
                .FirstOrDefaultAsync(t => t.ProductBranchId == dbMapping.Id);
            Assert.NotNull(task);
        }

        [Fact]
        public async Task AddBranchToProductAsync_ExistingBranchName_MapsItWithoutDuplicates()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Branch "Fizik" (Id = 2) is already seeded, but not mapped to Product 1.
            var originalBranchCount = await context.Branches.CountAsync();

            // Act
            var branchDto = await service.AddBranchToProductAsync(1, "Fizik");

            // Assert
            Assert.NotNull(branchDto);
            Assert.Equal("Fizik", branchDto.Name);
            Assert.Equal(2, branchDto.Id);

            // Verify no new branch was created in DB
            var newBranchCount = await context.Branches.CountAsync();
            Assert.Equal(originalBranchCount, newBranchCount);

            // Verify mapping exists
            var mapping = await context.ProductBranches
                .FirstOrDefaultAsync(pb => pb.ProductId == 1 && pb.BranchId == 2);
            Assert.NotNull(mapping);
        }

        [Fact]
        public async Task RemoveBranchFromProductAsync_ValidId_RemovesMapping()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var removed = await service.RemoveBranchFromProductAsync(1); // Remove ProductBranchId = 1

            // Assert
            Assert.True(removed);
            var mapping = await context.ProductBranches.FindAsync(1);
            Assert.Null(mapping);
        }

        [Fact]
        public async Task RemoveBranchFromProductAsync_InvalidId_ReturnsFalse()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new ProductService(context);

            // Act
            var removed = await service.RemoveBranchFromProductAsync(999);

            // Assert
            Assert.False(removed);
        }
    }
}
