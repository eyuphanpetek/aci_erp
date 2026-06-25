using Microsoft.EntityFrameworkCore;
using ErpApi.Data;
using ErpApi.Models;
using ErpApi.Models.Dtos;

namespace ErpApi.Services;

public class UserService
{
    private readonly ErpDbContext _context;
    private readonly AuthService _authService;

    public UserService(ErpDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    /// <summary>
    /// Get all users with their roles (paginated).
    /// </summary>
    public async Task<(List<UserDto> Users, int TotalCount)> GetUsersAsync(string? search = null, int page = 1, int pageSize = 10)
    {
        var query = _context.Users.Include(u => u.Role).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => UserDto.FromUser(u))
            .ToListAsync();

        return (users, totalCount);
    }

    /// <summary>
    /// Get a single user by ID.
    /// </summary>
    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user == null ? null : UserDto.FromUser(user);
    }

    /// <summary>
    /// Create a new user (SuperAdmin only).
    /// </summary>
    public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
    {
        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        // Validate role exists
        if (!await _context.Roles.AnyAsync(r => r.Id == request.RoleId))
        {
            throw new InvalidOperationException("The specified role does not exist.");
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _authService.HashPassword(request.Password),
            FullName = request.FullName,
            RoleId = request.RoleId,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Reload with Role navigation property
        await _context.Entry(user).Reference(u => u.Role).LoadAsync();

        return UserDto.FromUser(user);
    }

    /// <summary>
    /// Update an existing user.
    /// </summary>
    public async Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;

        if (request.FullName != null) user.FullName = request.FullName;
        if (request.RoleId.HasValue)
        {
            if (!await _context.Roles.AnyAsync(r => r.Id == request.RoleId.Value))
                throw new InvalidOperationException("The specified role does not exist.");
            user.RoleId = request.RoleId.Value;
        }
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Reload role if changed
        await _context.Entry(user).Reference(u => u.Role).LoadAsync();

        return UserDto.FromUser(user);
    }

    /// <summary>
    /// Deactivate a user (soft delete).
    /// </summary>
    public async Task<bool> DeactivateUserAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }
}
