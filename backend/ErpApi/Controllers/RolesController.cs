using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ErpApi.Data;

namespace ErpApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
public class RolesController : ControllerBase
{
    private readonly ErpDbContext _context;

    public RolesController(ErpDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Description,
                UserCount = r.Users.Count
            })
            .ToListAsync();

        return Ok(roles);
    }
}
