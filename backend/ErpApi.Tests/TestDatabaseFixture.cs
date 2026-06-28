using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;

namespace ErpApi.Tests
{
    public static class TestDatabaseFixture
    {
        public static ErpDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ErpDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new ErpDbContext(options);
            SeedDatabase(context);
            return context;
        }

        private static void SeedDatabase(ErpDbContext context)
        {
            // Seed Roles
            var roles = new List<Role>
            {
                new() { Id = 1, Name = "SuperAdmin", Description = "Super Admin" },
                new() { Id = 2, Name = "Admin", Description = "Admin" },
                new() { Id = 3, Name = "Manager", Description = "Manager" },
                new() { Id = 4, Name = "Employee", Description = "Employee" }
            };
            context.Roles.AddRange(roles);

            // Seed Users
            var superAdmin = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "superadmin@erp.local",
                PasswordHash = "hashed",
                FullName = "Sistem Yöneticisi",
                RoleId = 1,
                IsActive = true
            };

            var authorUser = new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Email = "yazar@erp.local",
                PasswordHash = "hashed",
                FullName = "Metehan Yazar",
                RoleId = 4,
                IsActive = true
            };

            var typesetterUser = new User
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Email = "dizgici@erp.local",
                PasswordHash = "hashed",
                FullName = "Ahmet Dizgici",
                RoleId = 4,
                IsActive = true
            };

            context.Users.AddRange(superAdmin, authorUser, typesetterUser);

            // Seed Categories
            var categories = new List<Category>
            {
                new() { Id = 1, Name = "SORU BANKASI", SortOrder = 1 },
                new() { Id = 2, Name = "YAPRAK TEST", SortOrder = 2 }
            };
            context.Categories.AddRange(categories);

            // Seed Products
            var products = new List<Product>
            {
                new() { Id = 1, Name = "TYT Matematik Soru Bankası", CategoryId = 1, SortOrder = 1 },
                new() { Id = 2, Name = "AYT Fizik Soru Bankası", CategoryId = 1, SortOrder = 2 }
            };
            context.Products.AddRange(products);

            // Seed Branches
            var branches = new List<Branch>
            {
                new() { Id = 1, Name = "Matematik" },
                new() { Id = 2, Name = "Fizik" }
            };
            context.Branches.AddRange(branches);

            // Seed ProductBranches
            var productBranches = new List<ProductBranch>
            {
                new() { Id = 1, ProductId = 1, BranchId = 1 },
                new() { Id = 2, ProductId = 2, BranchId = 2 }
            };
            context.ProductBranches.AddRange(productBranches);

            // Seed Tariff Items
            var tariffs = new List<TariffItem>
            {
                new() { Id = 1, Name = "Geleneksel Soru", UnitPrice = 175m, Unit = "soru", SortOrder = 1 },
                new() { Id = 2, Name = "Kavram Temelli", UnitPrice = 245m, Unit = "soru", SortOrder = 2 },
                new() { Id = 3, Name = "Bağlam Temelli", UnitPrice = 500m, Unit = "soru", SortOrder = 3 },
                new() { Id = 4, Name = "Konu Anlatım Sayfa", UnitPrice = 910m, Unit = "sayfa", SortOrder = 4 },
                new() { Id = 5, Name = "Revize", UnitPrice = 175m, Unit = "sayfa", SortOrder = 5 },
                new() { Id = 6, Name = "Çapraz", UnitPrice = 147m, Unit = "sayfa", SortOrder = 6 }
            };
            context.TariffItems.AddRange(tariffs);

            context.SaveChanges();
        }
    }
}
