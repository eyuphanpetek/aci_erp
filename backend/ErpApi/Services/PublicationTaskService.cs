using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Models.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ErpApi.Services;

public class PublicationTaskService
{
    private readonly ErpDbContext _context;

    public PublicationTaskService(ErpDbContext context)
    {
        _context = context;
    }

    public async Task<List<PublicationTaskDto>> GetTasksByCategoryAsync(int categoryId)
    {
        // 1. Fetch active tariffs for calculation
        var tariffs = await _context.TariffItems.AsNoTracking().ToDictionaryAsync(t => t.Name, t => t.UnitPrice);
        
        decimal getPrice(string name, decimal fallback = 0) => tariffs.TryGetValue(name, out var val) ? val : fallback;

        var traditionalPrice = getPrice("Geleneksel Soru", 175m);
        var conceptPrice = getPrice("Kavram Temelli", 245m);
        var contextPrice = getPrice("Bağlam Temelli", 500m);
        var topicPagePrice = getPrice("Konu Anlatım Sayfa", 910m);
        var pagePrice = getPrice("Revize", 175m);
        var testPrice = getPrice("Çapraz", 147m);

        // 2. Self-healing check: Ensure every ProductBranch in this category has a PublicationTask
        // Optimized: Uses a single database query to find missing branches, rather than loading all
        // product branches and all task IDs across the entire system into memory.
        var missingBranches = await _context.ProductBranches
            .Where(pb => pb.Product.CategoryId == categoryId && !pb.Tasks.Any())
            .ToListAsync();

        if (missingBranches.Any())
        {
            foreach (var pb in missingBranches)
            {
                _context.PublicationTasks.Add(new PublicationTask { ProductBranchId = pb.Id });
            }
            await _context.SaveChangesAsync();
        }

        // 3. Fetch and map all tasks
        var tasks = await _context.PublicationTasks
            .AsNoTracking()
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Product)
                    .ThenInclude(p => p.Category)
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Branch)
            .Include(pt => pt.Author)
            .Include(pt => pt.Typesetter)
            .Where(pt => pt.ProductBranch.Product.CategoryId == categoryId)
            .OrderBy(pt => pt.ProductBranch.Product.SortOrder)
                .ThenBy(pt => pt.ProductBranch.Branch.Name)
            .ToListAsync();

        return tasks.Select(t =>
        {
            var calculatedCost = (t.TraditionalCount * traditionalPrice) +
                                 (t.ConceptCount * conceptPrice) +
                                 (t.ContextCount * contextPrice) +
                                 (t.TopicPageCount * topicPagePrice) +
                                 (t.PageCount * pagePrice) +
                                 (t.TestCount * testPrice);

            return new PublicationTaskDto
            {
                Id = t.Id,
                ProductBranchId = t.ProductBranchId,
                ProductId = t.ProductBranch.ProductId,
                ProductName = t.ProductBranch.Product.Name,
                CategoryId = t.ProductBranch.Product.CategoryId,
                CategoryName = t.ProductBranch.Product.Category?.Name ?? string.Empty,
                BranchId = t.ProductBranch.BranchId,
                BranchName = t.ProductBranch.Branch.Name,
                AuthorId = t.AuthorId,
                AuthorName = t.Author?.FullName,
                TypesetterId = t.TypesetterId,
                TypesetterName = t.Typesetter?.FullName,
                PageCount = t.PageCount,
                TestCount = t.TestCount,
                TraditionalCount = t.TraditionalCount,
                ConceptCount = t.ConceptCount,
                ContextCount = t.ContextCount,
                TopicPageCount = t.TopicPageCount,
                AuthorStartDate = t.AuthorStartDate,
                TypesetterStartDate = t.TypesetterStartDate,
                Proofread1Date = t.Proofread1Date,
                Proofread2Date = t.Proofread2Date,
                Proofread3Date = t.Proofread3Date,
                Description = t.Description,
                CalculatedCost = calculatedCost
            };
        }).ToList();
    }

    public async Task<List<PublicationTaskDto>> GetTasksByAuthorAsync(Guid userId)
    {
        var tariffs = await _context.TariffItems.AsNoTracking().ToDictionaryAsync(t => t.Name, t => t.UnitPrice);
        decimal getPrice(string name, decimal fallback = 0) => tariffs.TryGetValue(name, out var val) ? val : fallback;

        var traditionalPrice = getPrice("Geleneksel Soru", 175m);
        var conceptPrice = getPrice("Kavram Temelli", 245m);
        var contextPrice = getPrice("Bağlam Temelli", 500m);
        var topicPagePrice = getPrice("Konu Anlatım Sayfa", 910m);
        var pagePrice = getPrice("Revize", 175m);
        var testPrice = getPrice("Çapraz", 147m);

        var tasks = await _context.PublicationTasks
            .AsNoTracking()
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Product)
                    .ThenInclude(p => p.Category)
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Branch)
            .Include(pt => pt.Author)
            .Include(pt => pt.Typesetter)
            .Where(pt => pt.AuthorId == userId || pt.TypesetterId == userId)
            .OrderBy(pt => pt.ProductBranch.Product.Category.Name)
                .ThenBy(pt => pt.ProductBranch.Product.Name)
            .ToListAsync();

        return tasks.Select(t =>
        {
            var cost = (t.TraditionalCount * traditionalPrice) + (t.ConceptCount * conceptPrice) +
                       (t.ContextCount * contextPrice) + (t.TopicPageCount * topicPagePrice) +
                       (t.PageCount * pagePrice) + (t.TestCount * testPrice);
            return new PublicationTaskDto
            {
                Id = t.Id,
                ProductBranchId = t.ProductBranchId,
                ProductId = t.ProductBranch.ProductId,
                ProductName = t.ProductBranch.Product.Name,
                CategoryId = t.ProductBranch.Product.CategoryId,
                CategoryName = t.ProductBranch.Product.Category?.Name ?? string.Empty,
                BranchId = t.ProductBranch.BranchId,
                BranchName = t.ProductBranch.Branch.Name,
                AuthorId = t.AuthorId,
                AuthorName = t.Author?.FullName,
                TypesetterId = t.TypesetterId,
                TypesetterName = t.Typesetter?.FullName,
                PageCount = t.PageCount, TestCount = t.TestCount,
                TraditionalCount = t.TraditionalCount, ConceptCount = t.ConceptCount,
                ContextCount = t.ContextCount, TopicPageCount = t.TopicPageCount,
                AuthorStartDate = t.AuthorStartDate, TypesetterStartDate = t.TypesetterStartDate,
                Proofread1Date = t.Proofread1Date, Proofread2Date = t.Proofread2Date, Proofread3Date = t.Proofread3Date,
                Description = t.Description,
                CalculatedCost = cost
            };
        }).ToList();
    }

    public async Task<PublicationTaskDto?> UpdateTaskCostAsync(int taskId, UpdateTaskCostDto dto)
    {
        var task = await _context.PublicationTasks
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Product)
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Branch)
            .Include(pt => pt.Author)
            .Include(pt => pt.Typesetter)
            .FirstOrDefaultAsync(pt => pt.Id == taskId);

        if (task == null) return null;

        task.PageCount = dto.PageCount;
        task.TestCount = dto.TestCount;
        task.TraditionalCount = dto.TraditionalCount;
        task.ConceptCount = dto.ConceptCount;
        task.ContextCount = dto.ContextCount;
        task.TopicPageCount = dto.TopicPageCount;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Recalculate cost
        var tariffs = await _context.TariffItems.AsNoTracking().ToDictionaryAsync(t => t.Name, t => t.UnitPrice);
        decimal getPrice(string name, decimal fallback = 0) => tariffs.TryGetValue(name, out var val) ? val : fallback;

        var calculatedCost = (task.TraditionalCount * getPrice("Geleneksel Soru", 175m)) +
                             (task.ConceptCount * getPrice("Kavram Temelli", 245m)) +
                             (task.ContextCount * getPrice("Bağlam Temelli", 500m)) +
                             (task.TopicPageCount * getPrice("Konu Anlatım Sayfa", 910m)) +
                             (task.PageCount * getPrice("Revize", 175m)) +
                             (task.TestCount * getPrice("Çapraz", 147m));

        return new PublicationTaskDto
        {
            Id = task.Id,
            ProductBranchId = task.ProductBranchId,
            ProductId = task.ProductBranch.ProductId,
            ProductName = task.ProductBranch.Product.Name,
            BranchId = task.ProductBranch.BranchId,
            BranchName = task.ProductBranch.Branch.Name,
            AuthorId = task.AuthorId,
            AuthorName = task.Author?.FullName,
            TypesetterId = task.TypesetterId,
            TypesetterName = task.Typesetter?.FullName,
            PageCount = task.PageCount,
            TestCount = task.TestCount,
            TraditionalCount = task.TraditionalCount,
            ConceptCount = task.ConceptCount,
            ContextCount = task.ContextCount,
            TopicPageCount = task.TopicPageCount,
            AuthorStartDate = task.AuthorStartDate,
            TypesetterStartDate = task.TypesetterStartDate,
            Proofread1Date = task.Proofread1Date,
            Proofread2Date = task.Proofread2Date,
            Proofread3Date = task.Proofread3Date,
            Description = task.Description,
            CalculatedCost = calculatedCost
        };
    }

    public async Task<PublicationTaskDto?> UpdateTaskWorkflowAsync(int taskId, UpdateTaskWorkflowDto dto)
    {
        var task = await _context.PublicationTasks
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Product)
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Branch)
            .Include(pt => pt.Author)
            .Include(pt => pt.Typesetter)
            .FirstOrDefaultAsync(pt => pt.Id == taskId);

        if (task == null) return null;

        task.AuthorId = dto.AuthorId;
        task.TypesetterId = dto.TypesetterId;
        task.AuthorStartDate = dto.AuthorStartDate;
        task.TypesetterStartDate = dto.TypesetterStartDate;
        task.Proofread1Date = dto.Proofread1Date;
        task.Proofread2Date = dto.Proofread2Date;
        task.Proofread3Date = dto.Proofread3Date;
        task.Description = dto.Description;
        task.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Refresh navigation properties in memory after update
        await _context.Entry(task).Reference(t => t.Author).LoadAsync();
        await _context.Entry(task).Reference(t => t.Typesetter).LoadAsync();

        // Recalculate cost
        var tariffs = await _context.TariffItems.AsNoTracking().ToDictionaryAsync(t => t.Name, t => t.UnitPrice);
        decimal getPrice(string name, decimal fallback = 0) => tariffs.TryGetValue(name, out var val) ? val : fallback;

        var calculatedCost = (task.TraditionalCount * getPrice("Geleneksel Soru", 175m)) +
                             (task.ConceptCount * getPrice("Kavram Temelli", 245m)) +
                             (task.ContextCount * getPrice("Bağlam Temelli", 500m)) +
                             (task.TopicPageCount * getPrice("Konu Anlatım Sayfa", 910m)) +
                             (task.PageCount * getPrice("Revize", 175m)) +
                             (task.TestCount * getPrice("Çapraz", 147m));

        return new PublicationTaskDto
        {
            Id = task.Id,
            ProductBranchId = task.ProductBranchId,
            ProductId = task.ProductBranch.ProductId,
            ProductName = task.ProductBranch.Product.Name,
            BranchId = task.ProductBranch.BranchId,
            BranchName = task.ProductBranch.Branch.Name,
            AuthorId = task.AuthorId,
            AuthorName = task.Author?.FullName,
            TypesetterId = task.TypesetterId,
            TypesetterName = task.Typesetter?.FullName,
            PageCount = task.PageCount,
            TestCount = task.TestCount,
            TraditionalCount = task.TraditionalCount,
            ConceptCount = task.ConceptCount,
            ContextCount = task.ContextCount,
            TopicPageCount = task.TopicPageCount,
            AuthorStartDate = task.AuthorStartDate,
            TypesetterStartDate = task.TypesetterStartDate,
            Proofread1Date = task.Proofread1Date,
            Proofread2Date = task.Proofread2Date,
            Proofread3Date = task.Proofread3Date,
            Description = task.Description,
            CalculatedCost = calculatedCost
        };
    }

    public async Task<PublishingTotalsDto> GetTotalsAsync(int categoryId)
    {
        var tariffs = await _context.TariffItems.AsNoTracking().ToDictionaryAsync(t => t.Name, t => t.UnitPrice);
        decimal getPrice(string name, decimal fallback = 0) => tariffs.TryGetValue(name, out var val) ? val : fallback;

        var traditionalPrice = getPrice("Geleneksel Soru", 175m);
        var conceptPrice = getPrice("Kavram Temelli", 245m);
        var contextPrice = getPrice("Bağlam Temelli", 500m);
        var topicPagePrice = getPrice("Konu Anlatım Sayfa", 910m);
        var pagePrice = getPrice("Revize", 175m);
        var testPrice = getPrice("Çapraz", 147m);

        // Aggregate totals directly in the database instead of loading all tasks into memory
        var stats = await _context.PublicationTasks
            .AsNoTracking()
            .GroupBy(t => t.ProductBranch.Product.CategoryId == categoryId)
            .Select(g => new
            {
                IsCategory = g.Key,
                TraditionalCount = g.Sum(x => x.TraditionalCount),
                ConceptCount = g.Sum(x => x.ConceptCount),
                ContextCount = g.Sum(x => x.ContextCount),
                TopicPageCount = g.Sum(x => x.TopicPageCount),
                PageCount = g.Sum(x => x.PageCount),
                TestCount = g.Sum(x => x.TestCount)
            })
            .ToListAsync();

        decimal categoryTotal = 0;
        decimal grandTotal = 0;

        foreach (var stat in stats)
        {
            var cost = (stat.TraditionalCount * traditionalPrice) +
                       (stat.ConceptCount * conceptPrice) +
                       (stat.ContextCount * contextPrice) +
                       (stat.TopicPageCount * topicPagePrice) +
                       (stat.PageCount * pagePrice) +
                       (stat.TestCount * testPrice);

            grandTotal += cost;
            if (stat.IsCategory)
            {
                categoryTotal += cost;
            }
        }

        return new PublishingTotalsDto
        {
            CategoryTotal = categoryTotal,
            GrandTotal = grandTotal
        };
    }

    public async Task<List<PublicationTaskDto>> SearchTasksByAuthorAsync(string authorName)
    {
        var tariffs = await _context.TariffItems.AsNoTracking().ToDictionaryAsync(t => t.Name, t => t.UnitPrice);
        decimal getPrice(string name, decimal fallback = 0) => tariffs.TryGetValue(name, out var val) ? val : fallback;

        var traditionalPrice = getPrice("Geleneksel Soru", 175m);
        var conceptPrice = getPrice("Kavram Temelli", 245m);
        var contextPrice = getPrice("Bağlam Temelli", 500m);
        var topicPagePrice = getPrice("Konu Anlatım Sayfa", 910m);
        var pagePrice = getPrice("Revize", 175m);
        var testPrice = getPrice("Çapraz", 147m);

        var tasks = await _context.PublicationTasks
            .AsNoTracking()
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Product)
            .Include(pt => pt.ProductBranch)
                .ThenInclude(pb => pb.Branch)
            .Include(pt => pt.Author)
            .Include(pt => pt.Typesetter)
            .Where(pt => pt.Author != null && pt.Author.FullName.ToLower().Contains(authorName.ToLower()))
            .OrderBy(pt => pt.ProductBranch.Product.SortOrder)
            .ToListAsync();

        return tasks.Select(t =>
        {
            var calculatedCost = (t.TraditionalCount * traditionalPrice) +
                                 (t.ConceptCount * conceptPrice) +
                                 (t.ContextCount * contextPrice) +
                                 (t.TopicPageCount * topicPagePrice) +
                                 (t.PageCount * pagePrice) +
                                 (t.TestCount * testPrice);

            return new PublicationTaskDto
            {
                Id = t.Id,
                ProductBranchId = t.ProductBranchId,
                ProductId = t.ProductBranch.ProductId,
                ProductName = t.ProductBranch.Product.Name,
                BranchId = t.ProductBranch.BranchId,
                BranchName = t.ProductBranch.Branch.Name,
                AuthorId = t.AuthorId,
                AuthorName = t.Author?.FullName,
                TypesetterId = t.TypesetterId,
                TypesetterName = t.Typesetter?.FullName,
                PageCount = t.PageCount,
                TestCount = t.TestCount,
                TraditionalCount = t.TraditionalCount,
                ConceptCount = t.ConceptCount,
                ContextCount = t.ContextCount,
                TopicPageCount = t.TopicPageCount,
                AuthorStartDate = t.AuthorStartDate,
                TypesetterStartDate = t.TypesetterStartDate,
                Proofread1Date = t.Proofread1Date,
                Proofread2Date = t.Proofread2Date,
                Proofread3Date = t.Proofread3Date,
                Description = t.Description,
                CalculatedCost = calculatedCost
            };
        }).ToList();
    }
}
