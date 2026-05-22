using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using TaskFlow.Api.DTOs.Auth;
using TaskFlow.Api.Models;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", Register);
        group.MapPost("/login", Login);
    }
    
    static async Task<IResult> Register(
        RegisterRequest request,
        AppDbContext db,
        JwtService jwtService
    )
    {
        var emailToken = await db.Users.AnyAsync(u => u.Email == request.Email);

        if (emailToken)
        {
            return Results.Conflict("Email is already registered.");
        }

        var user = new User
        {
            Email = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName.Trim()
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = jwtService.GenerateToken(user);

        return Results.Ok(new AuthResponse
        {
            Token = token,
            Email = user.Email,
            DisplayName = user.DisplayName
        });
    }

    static async Task<IResult> Login(
        LoginRequest request,
        AppDbContext db,
        JwtService jwtService
    )
    {
        // 1. Find the user by email
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.Trim().ToLower());

        if (user is null)
        {
            return Results.Unauthorized();
        }

        // 2. Verify the password
        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordValid)
        {
            return Results.Unauthorized();
        }

        // 3. Issue token
        var token = jwtService.GenerateToken(user);

        return Results.Ok(new AuthResponse
        {
            Token = token,
            Email = user.Email,
            DisplayName = user.DisplayName
        });
    }
}