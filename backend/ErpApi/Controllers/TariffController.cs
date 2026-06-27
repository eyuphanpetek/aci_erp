using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ErpApi.Models.Dtos;
using ErpApi.Services;
using System.Threading.Tasks;

namespace ErpApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TariffController : ControllerBase
{
    private readonly TariffService _tariffService;

    public TariffController(TariffService tariffService)
    {
        _tariffService = tariffService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTariffs()
    {
        var tariffs = await _tariffService.GetAllAsync();
        return Ok(tariffs);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateTariffPrice(int id, [FromBody] UpdateTariffDto request)
    {
        if (request.UnitPrice < 0) 
            return BadRequest("Birim fiyat 0'dan küçük olamaz.");
        
        var updated = await _tariffService.UpdateTariffPriceAsync(id, request.UnitPrice);
        if (updated == null) 
            return NotFound("Fiyat kalemi bulunamadı.");
        
        return Ok(updated);
    }
}
