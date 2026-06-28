using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Services;

namespace ErpApi.Tests;

public class ProductServiceTests
{
    private ErpDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ErpDbContext>()
            .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
            .Options;

        return new ErpDbContext(options);
    }

    [Fact]
    public async Task CreateProductAsync_ValidCategory_CreatesProductAndSeedsBranches()
    {
        // Arrange
        using var context = GetInMemoryDbContext();

        var category = new Category { Name = "Test Category" };
        context.Categories.Add(category);

        var defaultBranches = new[] { "Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe" };
        foreach (var branchName in defaultBranches)
        {
            context.Branches.Add(new Branch { Name = branchName });
        }
        await context.SaveChangesAsync();

        var service = new ProductService(context);

        // Act
        var result = await service.CreateProductAsync("New Product", category.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Product", result.Name);
        Assert.Equal(category.Id, result.CategoryId);
        Assert.Equal(1, result.SortOrder); // Max + 1, and there were no products

        var createdProduct = await context.Products.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.NotNull(createdProduct);

        var productBranches = await context.ProductBranches.Where(pb => pb.ProductId == createdProduct.Id).ToListAsync();
        Assert.Equal(defaultBranches.Length, productBranches.Count);

        var publicationTasks = await context.PublicationTasks.Where(pt => productBranches.Select(pb => pb.Id).Contains(pt.ProductBranchId)).ToListAsync();
        Assert.Equal(defaultBranches.Length, publicationTasks.Count);
    }

    [Fact]
    public async Task CreateProductAsync_InvalidCategory_ReturnsNull()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new ProductService(context);

        // Act
        var result = await service.CreateProductAsync("New Product", 999); // 999 is non-existent

        // Assert
        Assert.Null(result);
        Assert.Empty(context.Products);
    }

    [Fact]
    public async Task CreateProductAsync_ExistingProductsInCategory_SetsCorrectSortOrder()
    {
        // Arrange
        using var context = GetInMemoryDbContext();

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
}
