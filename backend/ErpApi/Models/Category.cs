using System.Text.Json.Serialization;

namespace ErpApi.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
