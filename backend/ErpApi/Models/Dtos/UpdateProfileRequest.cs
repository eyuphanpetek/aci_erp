using System.ComponentModel.DataAnnotations;

namespace ErpApi.Models.Dtos;

public class UpdateProfileRequest
{
    public string? FullName { get; set; }

    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$",
        ErrorMessage = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")]
    public string? Password { get; set; }
}
