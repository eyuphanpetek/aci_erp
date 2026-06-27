using System;
using System.Collections.Generic;

namespace ErpApi.Models.Dtos;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public List<ProductDto> Products { get; set; } = new();
}

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int SortOrder { get; set; }
    public List<BranchDto> Branches { get; set; } = new();
}

public class BranchDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductBranchId { get; set; } // Join entity ID for easy removal
}

public class TariffItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class UpdateTariffDto
{
    public decimal UnitPrice { get; set; }
}

public class PublicationTaskDto
{
    public int Id { get; set; }
    public int ProductBranchId { get; set; }
    
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;

    public Guid? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public Guid? TypesetterId { get; set; }
    public string? TypesetterName { get; set; }

    // Volume Metrics
    public int PageCount { get; set; }
    public int TestCount { get; set; }
    public int TraditionalCount { get; set; }
    public int ConceptCount { get; set; }
    public int ContextCount { get; set; }
    public int TopicPageCount { get; set; }

    // Dates
    public DateTime? AuthorStartDate { get; set; }
    public DateTime? TypesetterStartDate { get; set; }
    public DateTime? Proofread1Date { get; set; }
    public DateTime? Proofread2Date { get; set; }
    public DateTime? Proofread3Date { get; set; }

    public string? Description { get; set; }

    // Dynamically Calculated Cost
    public decimal CalculatedCost { get; set; }
}

public class UpdateTaskCostDto
{
    public int PageCount { get; set; }
    public int TestCount { get; set; }
    public int TraditionalCount { get; set; }
    public int ConceptCount { get; set; }
    public int ContextCount { get; set; }
    public int TopicPageCount { get; set; }
}

public class UpdateTaskWorkflowDto
{
    public Guid? AuthorId { get; set; }
    public Guid? TypesetterId { get; set; }
    public DateTime? AuthorStartDate { get; set; }
    public DateTime? TypesetterStartDate { get; set; }
    public DateTime? Proofread1Date { get; set; }
    public DateTime? Proofread2Date { get; set; }
    public DateTime? Proofread3Date { get; set; }
    public string? Description { get; set; }
}

public class PublishingTotalsDto
{
    public decimal CategoryTotal { get; set; }
    public decimal GrandTotal { get; set; }
}
