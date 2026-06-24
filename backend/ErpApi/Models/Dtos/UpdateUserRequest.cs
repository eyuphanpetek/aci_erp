namespace ErpApi.Models.Dtos;

public class UpdateUserRequest
{
    public string? FullName { get; set; }
    public int? RoleId { get; set; }
    public bool? IsActive { get; set; }
}
