using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Models.Dtos;
using System.Threading.Tasks;
using System.Linq;

namespace ErpApi.Services;

public class ProductService
{
    private readonly ErpDbContext _context;

    public ProductService(ErpDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDto?> CreateProductAsync(string name, int categoryId)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null) return null;

        var maxSortOrder = await _context.Products
            .Where(p => p.CategoryId == categoryId)
            .Select(p => (int?)p.SortOrder)
            .MaxAsync() ?? 0;

        var product = new Product
        {
            Name = name,
            CategoryId = categoryId,
            SortOrder = maxSortOrder + 1
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Dynamically seed standard branches to new products to save time for user,
        // matching typical educational publisher workflow.
        // We'll add Matematik, Geometri, Fizik, Kimya, Biyoloji, Türkçe as defaults.
        var defaultBranches = await _context.Branches
            .Where(b => new[] { "Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe" }.Contains(b.Name))
            .ToListAsync();

        foreach (var branch in defaultBranches)
        {
            var pb = new ProductBranch
            {
                ProductId = product.Id,
                BranchId = branch.Id
            };
            _context.ProductBranches.Add(pb);
            await _context.SaveChangesAsync();

            var task = new PublicationTask
            {
                ProductBranchId = pb.Id
            };
            _context.PublicationTasks.Add(task);
        }
        await _context.SaveChangesAsync();

        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            CategoryId = product.CategoryId,
            SortOrder = product.SortOrder
        };
    }

    public async Task<bool> DeleteProductAsync(int productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<BranchDto?> AddBranchToProductAsync(int productId, string branchName)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null) return null;

        // Find or create the branch by name
        var branch = await _context.Branches.FirstOrDefaultAsync(b => b.Name.ToLower() == branchName.Trim().ToLower());
        if (branch == null)
        {
            branch = new Branch { Name = branchName.Trim() };
            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();
        }

        // Check if mapping already exists
        var alreadyExists = await _context.ProductBranches
            .FirstOrDefaultAsync(pb => pb.ProductId == productId && pb.BranchId == branch.Id);
            
        if (alreadyExists != null)
        {
            return new BranchDto
            {
                Id = branch.Id,
                Name = branch.Name,
                ProductBranchId = alreadyExists.Id
            };
        }

        var pb = new ProductBranch
        {
            ProductId = productId,
            BranchId = branch.Id
        };
        _context.ProductBranches.Add(pb);
        await _context.SaveChangesAsync();

        // Auto-initialize PublicationTask for this mapping
        var task = new PublicationTask
        {
            ProductBranchId = pb.Id
        };
        _context.PublicationTasks.Add(task);
        await _context.SaveChangesAsync();

        return new BranchDto
        {
            Id = branch.Id,
            Name = branch.Name,
            ProductBranchId = pb.Id
        };
    }

    public async Task<bool> RemoveBranchFromProductAsync(int productBranchId)
    {
        var pb = await _context.ProductBranches.FindAsync(productBranchId);
        if (pb == null) return false;

        _context.ProductBranches.Remove(pb);
        await _context.SaveChangesAsync();
        return true;
    }
}
