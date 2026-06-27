namespace ErpApi.Models;

public class PublicationTask
{
    public int Id { get; set; }
    public int ProductBranchId { get; set; }
    
    public Guid? AuthorId { get; set; }
    public Guid? TypesetterId { get; set; }

    // Volume Metrics for Cost Calculation
    public int PageCount { get; set; } = 0;
    public int TestCount { get; set; } = 0;
    public int TraditionalCount { get; set; } = 0;
    public int ConceptCount { get; set; } = 0;
    public int ContextCount { get; set; } = 0;
    public int TopicPageCount { get; set; } = 0;

    // Workflow Tracking Dates
    public DateTime? AuthorStartDate { get; set; }
    public DateTime? TypesetterStartDate { get; set; }
    public DateTime? Proofread1Date { get; set; }
    public DateTime? Proofread2Date { get; set; }
    public DateTime? Proofread3Date { get; set; }

    // Description/Notes (Açıklama)
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ProductBranch ProductBranch { get; set; } = null!;
    public User? Author { get; set; }
    public User? Typesetter { get; set; }
}
