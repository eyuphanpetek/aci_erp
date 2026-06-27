using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Models.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ErpApi.Services;

public class TariffService
{
    private readonly ErpDbContext _context;

    public TariffService(ErpDbContext context)
    {
        _context = context;
    }

    public async Task<List<TariffItemDto>> GetAllAsync()
    {
        var items = await _context.TariffItems
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        return items.Select(t => new TariffItemDto
        {
            Id = t.Id,
            Name = t.Name,
            UnitPrice = t.UnitPrice,
            Unit = t.Unit,
            SortOrder = t.SortOrder
        }).ToList();
    }

    public async Task<TariffItemDto?> UpdateTariffPriceAsync(int id, decimal newPrice)
    {
        var item = await _context.TariffItems.FindAsync(id);
        if (item == null) return null;

        item.UnitPrice = newPrice;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new TariffItemDto
        {
            Id = item.Id,
            Name = item.Name,
            UnitPrice = item.UnitPrice,
            Unit = item.Unit,
            SortOrder = item.SortOrder
        };
    }
}
