using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using TaskFlow.Api.DTOs.Boards;
using TaskFlow.Api.Models;
using System.Security.Claims;

namespace TaskFlow.Api.Endpoints;

public static class BoardEndpoints
{
    public static void MapBoardEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/boards").RequireAuthorization();

        group.MapGet("/", GetAllBoards);
        group.MapGet("/{id}", GetBoard);
        group.MapPost("/", CreateBoard);
        group.MapPut("/{id}", UpdateBoard);
        group.MapDelete("/{id}", DeleteBoard);
    }

    // ----- Get all boards for the logged in user -----
    static async Task<IResult> GetAllBoards(AppDbContext db, ClaimsPrincipal user)
    {
       var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

       var boards = await db.Boards
            .Where(b => b.OwnerId == userId)
            .Select(b => new BoardDto
            {
                Id = b.Id,
                Name = b.Name,
                Description = b.Description,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

            return Results.Ok(boards);
    }

    // ----- Get a single board by ID -----
    static async Task<IResult> GetBoard(Guid id, AppDbContext db, ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var board = await db.Boards
            .Where(b => b.Id == id && b.OwnerId == userId)
            .Select(b => new BoardDto
            {
                Id = b.Id,
                Name = b.Name,
                Description = b.Description,
                CreatedAt = b.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (board == null)
        {
            return Results.NotFound();
        }

        return Results.Ok(board);
    }

    // ----- Create a new board -----
    static async Task<IResult> CreateBoard(
            CreateBoardRequest request, 
            AppDbContext db, 
            ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var board = new Board
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        db.Boards.Add(board);
        await db.SaveChangesAsync();

        return Results.Created($"/api/boards/{board.Id}", new BoardDto
        {
            Id = board.Id,
            Name = board.Name,
            Description = board.Description,
            CreatedAt = board.CreatedAt
        });
    }

    // ----- Update a board  -----
    static async Task<IResult> UpdateBoard(
        Guid id, 
        UpdateBoardRequest request, 
        AppDbContext db, 
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);

        if (board == null)
        {
            return Results.NotFound();
        }

        board.Name = request.Name.Trim();
        board.Description = request.Description?.Trim();

        await db.SaveChangesAsync();

        return Results.Ok(new BoardDto
        {
            Id = board.Id,
            Name = board.Name,
            Description = board.Description,
            CreatedAt = board.CreatedAt
        });
    }

    // ----- Delete a board -----
    static async Task<IResult> DeleteBoard(Guid id, AppDbContext db, ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);

        if (board == null)
        {
            return Results.NotFound();
        }

        db.Boards.Remove(board);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}
