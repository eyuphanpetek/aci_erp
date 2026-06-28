using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Models.Dtos;
using ErpApi.Services;
using Xunit;

namespace ErpApi.Tests
{
    public class PublicationTaskServiceTests
    {
        [Fact]
        public async Task GetTasksByCategoryAsync_SelfHealsAndReturnsTasks()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new PublicationTaskService(context);

            // Assert precondition: No tasks in DB
            Assert.Empty(context.PublicationTasks);

            // Act
            var tasks = await service.GetTasksByCategoryAsync(1);

            // Assert
            // There are two seeded products in Category 1 ("SORU BANKASI"), which map to two ProductBranches.
            // Self-healing should have run and auto-created 2 tasks.
            Assert.Equal(2, tasks.Count);
            Assert.Equal(2, context.PublicationTasks.Count());
            
            // Validate DTO mapping
            var task1 = tasks.First(t => t.ProductBranchId == 1);
            Assert.Equal("TYT Matematik Soru Bankası", task1.ProductName);
            Assert.Equal("Matematik", task1.BranchName);
            Assert.Equal(1, task1.CategoryId);
            Assert.Equal("SORU BANKASI", task1.CategoryName);
            Assert.Equal(0, task1.CalculatedCost); // All question counts are 0 initially
        }

        [Fact]
        public async Task GetTasksByAuthorAsync_FiltersByAuthorOrTypesetter()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new PublicationTaskService(context);

            var authorId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var typesetterId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            // Add tasks manually
            context.PublicationTasks.Add(new PublicationTask
            {
                ProductBranchId = 1,
                AuthorId = authorId
            });

            context.PublicationTasks.Add(new PublicationTask
            {
                ProductBranchId = 2,
                TypesetterId = typesetterId
            });

            await context.SaveChangesAsync();

            // Act
            var authorTasks = await service.GetTasksByAuthorAsync(authorId);
            var typesetterTasks = await service.GetTasksByAuthorAsync(typesetterId);

            // Assert
            Assert.Single(authorTasks);
            Assert.Equal(1, authorTasks[0].ProductBranchId);
            Assert.Equal("Metehan Yazar", authorTasks[0].AuthorName);

            Assert.Single(typesetterTasks);
            Assert.Equal(2, typesetterTasks[0].ProductBranchId);
            Assert.Equal("Ahmet Dizgici", typesetterTasks[0].TypesetterName);
        }

        [Fact]
        public async Task UpdateTaskCostAsync_UpdatesMetricsAndCalculatesCost()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new PublicationTaskService(context);

            // Auto-create task via self-healing
            await service.GetTasksByCategoryAsync(1);
            var task = await context.PublicationTasks.FirstAsync(t => t.ProductBranchId == 1);

            var updateDto = new UpdateTaskCostDto
            {
                PageCount = 10,       // 10 * 175 = 1750
                TestCount = 5,        // 5 * 147 = 735
                TraditionalCount = 100, // 100 * 175 = 17500
                ConceptCount = 20,    // 20 * 245 = 4900
                ContextCount = 10,    // 10 * 500 = 5000
                TopicPageCount = 2     // 2 * 910 = 1820
                // Expected total: 1750 + 735 + 17500 + 4900 + 5000 + 1820 = 31705
            };

            // Act
            var updatedTaskDto = await service.UpdateTaskCostAsync(task.Id, updateDto);

            // Assert
            Assert.NotNull(updatedTaskDto);
            Assert.Equal(31705m, updatedTaskDto.CalculatedCost);

            // Verify in DB
            var dbTask = await context.PublicationTasks.FindAsync(task.Id);
            Assert.NotNull(dbTask);
            Assert.Equal(10, dbTask.PageCount);
            Assert.Equal(5, dbTask.TestCount);
            Assert.Equal(100, dbTask.TraditionalCount);
            Assert.Equal(20, dbTask.ConceptCount);
            Assert.Equal(10, dbTask.ContextCount);
            Assert.Equal(2, dbTask.TopicPageCount);
        }

        [Fact]
        public async Task UpdateTaskWorkflowAsync_UpdatesDatesAndAssignments()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new PublicationTaskService(context);

            await service.GetTasksByCategoryAsync(1);
            var task = await context.PublicationTasks.FirstAsync(t => t.ProductBranchId == 1);

            var authorId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var typesetterId = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var date = new DateTime(2026, 6, 28, 12, 0, 0, DateTimeKind.Utc);

            var workflowDto = new UpdateTaskWorkflowDto
            {
                AuthorId = authorId,
                TypesetterId = typesetterId,
                AuthorStartDate = date,
                TypesetterStartDate = date.AddDays(5),
                Proofread1Date = date.AddDays(10),
                Proofread2Date = date.AddDays(12),
                Proofread3Date = date.AddDays(15),
                Description = "Gözden geçirildi"
            };

            // Act
            var updatedTaskDto = await service.UpdateTaskWorkflowAsync(task.Id, workflowDto);

            // Assert
            Assert.NotNull(updatedTaskDto);
            Assert.Equal("Metehan Yazar", updatedTaskDto.AuthorName);
            Assert.Equal("Ahmet Dizgici", updatedTaskDto.TypesetterName);
            Assert.Equal(date, updatedTaskDto.AuthorStartDate);
            Assert.Equal("Gözden geçirildi", updatedTaskDto.Description);

            // Verify in DB
            var dbTask = await context.PublicationTasks.FindAsync(task.Id);
            Assert.NotNull(dbTask);
            Assert.Equal(authorId, dbTask.AuthorId);
            Assert.Equal(typesetterId, dbTask.TypesetterId);
            Assert.Equal(date, dbTask.AuthorStartDate);
            Assert.Equal("Gözden geçirildi", dbTask.Description);
        }

        [Fact]
        public async Task GetTotalsAsync_CalculatesCorrectCategoryAndGrandTotals()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new PublicationTaskService(context);

            // Set up two tasks in Category 1
            var task1 = new PublicationTask
            {
                ProductBranchId = 1,
                TraditionalCount = 10 // 10 * 175 = 1750
            };
            var task2 = new PublicationTask
            {
                ProductBranchId = 2,
                TraditionalCount = 20 // 20 * 175 = 3500
            };

            // Setup a task in Category 2 (Yaprak Test)
            // Add a product in Category 2
            var product3 = new Product { Id = 3, Name = "TYT Matematik Yaprak Test", CategoryId = 2, SortOrder = 1 };
            context.Products.Add(product3);
            var branch3 = new Branch { Id = 3, Name = "Geometri" };
            context.Branches.Add(branch3);
            var pb3 = new ProductBranch { Id = 3, ProductId = 3, BranchId = 3 };
            context.ProductBranches.Add(pb3);

            var task3 = new PublicationTask
            {
                ProductBranchId = 3,
                TraditionalCount = 30 // 30 * 175 = 5250
            };

            context.PublicationTasks.AddRange(task1, task2, task3);
            await context.SaveChangesAsync();

            // Act
            var totals = await service.GetTotalsAsync(1);

            // Assert
            // Category 1 Total = 1750 + 3500 = 5250
            // Grand Total = 1750 + 3500 + 5250 = 10500
            Assert.Equal(5250m, totals.CategoryTotal);
            Assert.Equal(10500m, totals.GrandTotal);
        }

        [Fact]
        public async Task SearchTasksByAuthorAsync_ReturnsMatchingTasks()
        {
            // Arrange
            using var context = TestDatabaseFixture.CreateContext();
            var service = new PublicationTaskService(context);

            var authorId = Guid.Parse("22222222-2222-2222-2222-222222222222"); // Metehan Yazar

            context.PublicationTasks.Add(new PublicationTask
            {
                ProductBranchId = 1,
                AuthorId = authorId
            });

            context.PublicationTasks.Add(new PublicationTask
            {
                ProductBranchId = 2
                // No author
            });

            await context.SaveChangesAsync();

            // Act
            var results = await service.SearchTasksByAuthorAsync("metehan");

            // Assert
            Assert.Single(results);
            Assert.Equal("Metehan Yazar", results[0].AuthorName);
        }
    }
}
