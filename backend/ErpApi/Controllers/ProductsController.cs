using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ErpApi.Services;
using System.Threading.Tasks;

namespace ErpApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductsController(ProductService productService)
    {
        _productService = productService;
    }

    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
    }

    public class AddBranchRequest
    {
        public string BranchName { get; set; } = string.Empty;
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) 
            return BadRequest("Ürün adı boş olamaz.");
        
        var product = await _productService.CreateProductAsync(request.Name, request.CategoryId);
        if (product == null) 
            return NotFound("Kategori bulunamadı.");
        
        return Ok(product);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var result = await _productService.DeleteProductAsync(id);
        if (!result) 
            return NotFound("Ürün bulunamadı.");
            
        return NoContent();
    }

    [HttpPost("{id}/branches")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> AddBranch(int id, [FromBody] AddBranchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.BranchName)) 
            return BadRequest("Branş adı boş olamaz.");
        
        var branchDto = await _productService.AddBranchToProductAsync(id, request.BranchName);
        if (branchDto == null) 
            return NotFound("Ürün bulunamadı.");
        
        return Ok(branchDto);
    }

    [HttpDelete("branches/{productBranchId}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> RemoveBranch(int productBranchId)
    {
        var result = await _productService.RemoveBranchFromProductAsync(productBranchId);
        if (!result) 
            return NotFound("Ürün-Branş eşleşmesi bulunamadı.");
            
        return NoContent();
    }
}
