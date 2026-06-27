using System.Text.Json.Serialization;

namespace ErpApi.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Category Category { get; set; } = null!;
    
    [JsonIgnore]
    public ICollection<ProductBranch> ProductBranches { get; set; } = new List<ProductBranch>();
}
