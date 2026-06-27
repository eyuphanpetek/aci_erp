using System.Text.Json.Serialization;

namespace ErpApi.Models;

public class ProductBranch
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int BranchId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Product Product { get; set; } = null!;
    public Branch Branch { get; set; } = null!;

    [JsonIgnore]
    public ICollection<PublicationTask> Tasks { get; set; } = new List<PublicationTask>();
}
