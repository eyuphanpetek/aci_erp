using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Models.Dtos;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ErpApi.Services;

public class CategoryService
{
    private readonly ErpDbContext _context;

    public CategoryService(ErpDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.Products)
                .ThenInclude(p => p.ProductBranches)
                    .ThenInclude(pb => pb.Branch)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Icon = c.Icon,
            SortOrder = c.SortOrder,
            Products = c.Products.OrderBy(p => p.SortOrder).Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                CategoryId = p.CategoryId,
                SortOrder = p.SortOrder,
                Branches = p.ProductBranches.Select(pb => new BranchDto
                {
                    Id = pb.Branch.Id,
                    Name = pb.Branch.Name,
                    ProductBranchId = pb.Id
                }).ToList()
            }).ToList()
        }).ToList();
    }
}
