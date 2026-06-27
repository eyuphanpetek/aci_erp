using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ErpApi.Models.Dtos;
using ErpApi.Services;
using ErpApi.Data;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace ErpApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PublicationTasksController : ControllerBase
{
    private readonly PublicationTaskService _taskService;
    private readonly ErpDbContext _context;

    public PublicationTasksController(PublicationTaskService taskService, ErpDbContext context)
    {
        _taskService = taskService;
        _context = context;
    }

    private Guid GetOperatorId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idClaim, out var guid) ? guid : Guid.Empty;
    }

    private bool IsAdminOrManager()
    {
        return User.IsInRole("SuperAdmin") || User.IsInRole("Admin") || User.IsInRole("Manager");
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] int categoryId)
    {
        var tasks = await _taskService.GetTasksByCategoryAsync(categoryId);
        
        // Security filter: If not admin/manager/coordinator, standard user should only see their assigned tasks or a filtered list
        // Wait, standard users (authors/typesetters) can see tasks but we should hide calculated costs if needed,
        // or just let them see the row data (since they pair-program/work together on pages).
        // Let's filter calculated costs: if not admin/manager/coordinator, we set CalculatedCost to 0.
        if (!IsAdminOrManager())
        {
            foreach (var t in tasks)
            {
                t.CalculatedCost = 0; // Strip financial data for regular employees
            }
        }

        return Ok(tasks);
    }

    [HttpGet("author/{userId}")]
    public async Task<IActionResult> GetTasksByAuthor(Guid userId)
    {
        var tasks = await _taskService.GetTasksByAuthorAsync(userId);
        if (!IsAdminOrManager())
        {
            foreach (var t in tasks) t.CalculatedCost = 0;
        }
        return Ok(tasks);
    }

    [HttpPut("{id}/cost")]
    public async Task<IActionResult> UpdateTaskCost(int id, [FromBody] UpdateTaskCostDto request)
    {
        if (request.PageCount < 0 || request.TestCount < 0 || request.TraditionalCount < 0 ||
            request.ConceptCount < 0 || request.ContextCount < 0 || request.TopicPageCount < 0)
        {
            return BadRequest("Değerler sıfırdan küçük olamaz.");
        }

        if (!IsAdminOrManager())
        {
            var task = await _context.PublicationTasks.FindAsync(id);
            if (task == null) return NotFound("Görev bulunamadı.");

            var currentUserId = GetOperatorId();
            if (task.AuthorId != currentUserId && task.TypesetterId != currentUserId)
            {
                return Forbid();
            }
        }

        var updated = await _taskService.UpdateTaskCostAsync(id, request);
        if (updated == null) return NotFound("Görev bulunamadı.");

        // Strip financial data for regular employees
        if (!IsAdminOrManager())
        {
            updated.CalculatedCost = 0;
        }

        return Ok(updated);
    }

    [HttpPut("{id}/workflow")]
    public async Task<IActionResult> UpdateTaskWorkflow(int id, [FromBody] UpdateTaskWorkflowDto request)
    {
        if (!IsAdminOrManager())
        {
            return Forbid();
        }

        var updated = await _taskService.UpdateTaskWorkflowAsync(id, request);
        if (updated == null) return NotFound("Görev bulunamadı.");

        return Ok(updated);
    }

    [HttpGet("totals")]
    public async Task<IActionResult> GetTotals([FromQuery] int categoryId)
    {
        if (!IsAdminOrManager())
        {
            return Forbid();
        }

        var totals = await _taskService.GetTotalsAsync(categoryId);
        return Ok(totals);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string author)
    {
        if (string.IsNullOrWhiteSpace(author))
        {
            return BadRequest("Yazar adı belirtilmelidir.");
        }

        var results = await _taskService.SearchTasksByAuthorAsync(author);
        
        // Strip financial data for regular employees
        if (!IsAdminOrManager())
        {
            foreach (var r in results)
            {
                r.CalculatedCost = 0;
            }
        }

        return Ok(results);
    }
}
