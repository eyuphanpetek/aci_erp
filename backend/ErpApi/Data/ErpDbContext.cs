using Microsoft.EntityFrameworkCore;
using ErpApi.Models;

namespace ErpApi.Data;

public class ErpDbContext : DbContext
{
    public ErpDbContext(DbContextOptions<ErpDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<ProductBranch> ProductBranches => Set<ProductBranch>();
    public DbSet<TariffItem> TariffItems => Set<TariffItem>();
    public DbSet<PublicationTask> PublicationTasks => Set<PublicationTask>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Role configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Name).IsRequired().HasMaxLength(50);
            entity.Property(r => r.Description).HasMaxLength(200);
            entity.HasIndex(r => r.Name).IsUnique();
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
            entity.HasIndex(u => u.Email).IsUnique();

            entity.HasOne(u => u.Role)
                  .WithMany(r => r.Users)
                  .HasForeignKey(u => u.RoleId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(c => c.Name).IsUnique();
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(100);
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Branch configuration
        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(b => b.Name).IsUnique();
        });

        // ProductBranch configuration
        modelBuilder.Entity<ProductBranch>(entity =>
        {
            entity.HasKey(pb => pb.Id);
            entity.HasIndex(pb => new { pb.ProductId, pb.BranchId }).IsUnique();

            entity.HasOne(pb => pb.Product)
                  .WithMany(p => p.ProductBranches)
                  .HasForeignKey(pb => pb.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pb => pb.Branch)
                  .WithMany(b => b.ProductBranches)
                  .HasForeignKey(pb => pb.BranchId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TariffItem configuration
        modelBuilder.Entity<TariffItem>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
            entity.Property(t => t.UnitPrice).HasPrecision(18, 2);
            entity.Property(t => t.Unit).IsRequired().HasMaxLength(50);
            entity.HasIndex(t => t.Name).IsUnique();
        });

        // PublicationTask configuration
        modelBuilder.Entity<PublicationTask>(entity =>
        {
            entity.HasKey(pt => pt.Id);
            entity.HasIndex(pt => pt.ProductBranchId).IsUnique(); // One task per product-branch mapping

            entity.HasOne(pt => pt.ProductBranch)
                  .WithMany(pb => pb.Tasks)
                  .HasForeignKey(pt => pt.ProductBranchId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pt => pt.Author)
                  .WithMany()
                  .HasForeignKey(pt => pt.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(pt => pt.Typesetter)
                  .WithMany()
                  .HasForeignKey(pt => pt.TypesetterId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
