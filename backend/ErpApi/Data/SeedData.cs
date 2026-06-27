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

            var authorUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "yazar@erp.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Yazar@123"),
                FullName = "Metehan Yazar",
                RoleId = 4, // Employee (Author)
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var typesetterUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "dizgici@erp.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Dizgici@123"),
                FullName = "Ahmet Dizgici",
                RoleId = 4, // Employee (Typesetter)
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(new[] { superAdmin, authorUser, typesetterUser });
            await context.SaveChangesAsync();
        }

        // Seed Categories
        if (!context.Categories.Any())
        {
            var categories = new List<Category>
            {
                new() { Name = "SORU BANKASI", SortOrder = 1 },
                new() { Name = "YAPRAK TEST", SortOrder = 2 },
                new() { Name = "DİD", SortOrder = 3 },
                new() { Name = "DEFTER", SortOrder = 4 },
                new() { Name = "ÖTD", SortOrder = 5 },
                new() { Name = "DENEME", SortOrder = 6 }
            };
            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        // Seed Branches
        if (!context.Branches.Any())
        {
            var branches = new List<Branch>
            {
                new() { Name = "Matematik" },
                new() { Name = "Geometri" },
                new() { Name = "Fizik" },
                new() { Name = "Kimya" },
                new() { Name = "Biyoloji" },
                new() { Name = "Türkçe" },
                new() { Name = "Tarih" },
                new() { Name = "Coğrafya" },
                new() { Name = "Felsefe" },
                new() { Name = "Din" }
            };
            context.Branches.AddRange(branches);
            await context.SaveChangesAsync();
        }

        // Seed Tariff Items
        if (!context.TariffItems.Any())
        {
            var tariffs = new List<TariffItem>
            {
                new() { Name = "Geleneksel Soru", UnitPrice = 175m, Unit = "soru", SortOrder = 1 },
                new() { Name = "Kavram Temelli", UnitPrice = 245m, Unit = "soru", SortOrder = 2 },
                new() { Name = "Bağlam Temelli", UnitPrice = 500m, Unit = "soru", SortOrder = 3 },
                new() { Name = "Konu Anlatım Sayfa", UnitPrice = 910m, Unit = "sayfa", SortOrder = 4 },
                new() { Name = "Revize", UnitPrice = 175m, Unit = "sayfa", SortOrder = 5 },
                new() { Name = "Çapraz", UnitPrice = 147m, Unit = "sayfa", SortOrder = 6 },
                new() { Name = "Video Çözümü", UnitPrice = 25m, Unit = "soru", SortOrder = 7 },
                new() { Name = "ÖTD Revize", UnitPrice = 35m, Unit = "soru", SortOrder = 8 }
            };
            context.TariffItems.AddRange(tariffs);
            await context.SaveChangesAsync();
        }
    }
}
