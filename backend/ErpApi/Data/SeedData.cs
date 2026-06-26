using Microsoft.EntityFrameworkCore;
using ErpApi.Models;

namespace ErpApi.Data;

public static class SeedData
{
    public static async Task InitializeAsync(ErpDbContext context)
    {
        // Ensure database is migrated using EF Core migrations tracking
        await context.Database.MigrateAsync();

        // Seed Roles
        if (!context.Roles.Any())
        {
            var roles = new List<Role>
            {
                new() { Id = 1, Name = "SuperAdmin", Description = "Full system access. Can manage all users, roles, and system settings." },
                new() { Id = 2, Name = "Admin", Description = "Administrative access. Can manage users and most system features." },
                new() { Id = 3, Name = "Manager", Description = "Department-level access. Can view reports and manage team members." },
                new() { Id = 4, Name = "Employee", Description = "Standard user access. Can access assigned modules and personal settings." }
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();
        }

        // Seed default SuperAdmin user
        if (!context.Users.Any())
        {
            var superAdmin = new User
            {
                Id = Guid.NewGuid(),
                Email = "superadmin@erp.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "Sistem Yöneticisi",
                RoleId = 1, // SuperAdmin
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(superAdmin);
            await context.SaveChangesAsync();
        }
    }
}
