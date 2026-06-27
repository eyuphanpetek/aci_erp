using System.Text.Json.Serialization;

namespace ErpApi.Models;

public class Branch
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [JsonIgnore]
    public ICollection<ProductBranch> ProductBranches { get; set; } = new List<ProductBranch>();
}
