using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using TaskFlow.Api.DTOs.Columns;
using TaskFlow.Api.Models;
using System.Security.Claims;

namespace TaskFlow.Api.Endpoints;

public static class ColumnEndpoints
{
    public static void MapColumnEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/columns").RequireAuthorization();

        group.MapGet("/board/{boardId}", GetColumns);
        group.MapPost("/", CreateColumn);
        group.MapPut("/{id}", UpdateColumn);
        group.MapDelete("/{id}", DeleteColumn);
    }

    // ----- Get all columns for the logged in user -----
    static async Task<IResult> GetColumns(Guid boardId, AppDbContext db, ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Verfiy the board belogs to the user
        var boardExists = await db.Boards.AnyAsync(b => b.Id == boardId && b.OwnerId == userId);

        if (!boardExists)
        {
            return Results.NotFound();
        }

        var columns = await db.Columns
            .Where(c => c.BoardId == boardId)
            .OrderBy(c => c.Position)
            .Select(c => new ColumnDto
            {
                Id = c.Id,
                Name = c.Name,
                BoardId = c.BoardId,
                Position = c.Position,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

            return Results.Ok(columns);
    }

    // ----- Create a new column -----
    static async Task<IResult> CreateColumn(
            CreateColumnRequest request, 
            AppDbContext db, 
            ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Verfiy the board belogs to the user
        var boardExists = await db.Boards.AnyAsync(b => b.Id == request.BoardId && b.OwnerId == userId);

        if (!boardExists)
        {
            return Results.NotFound();
        }

        // new column goes at the end
        var maxPosition = await db.Columns
            .Where(c => c.BoardId == request.BoardId)
            .MaxAsync(c => (int?)c.Position) ?? -1;

        var column = new Column
        {
            Name = request.Name.Trim(),
            BoardId = request.BoardId,
            Position = maxPosition + 1,
            CreatedAt = DateTime.UtcNow
        };

        db.Columns.Add(column);
        await db.SaveChangesAsync();

        return Results.Created($"/api/columns/{column.Id}", new ColumnDto
        {
            Id = column.Id,
            Name = column.Name,
            Position = column.Position,
            BoardId = column.BoardId,
            CreatedAt = column.CreatedAt
        });
    }

    // ----- Update a column  -----
    static async Task<IResult> UpdateColumn(
        Guid id, 
        UpdateColumnRequest request, 
        AppDbContext db, 
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var column = await db.Columns
            .Include(c => c.Board)
            .FirstOrDefaultAsync(c => c.Id == id && c.Board.OwnerId == userId);
        
        if (column == null)
        {
            return Results.NotFound();
        }

        column.Name = request.Name.Trim();
        await db.SaveChangesAsync();

        return Results.Ok(new ColumnDto
        {
            Id = column.Id,
            Name = column.Name,
            Position = column.Position,
            BoardId = column.BoardId,
            CreatedAt = column.CreatedAt
        });
    }

    // ----- Delete a column -----
    static async Task<IResult> DeleteColumn(Guid id, AppDbContext db, ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        var column = await db.Columns
            .Include(c => c.Board)
            .FirstOrDefaultAsync(c => c.Id == id && c.Board.OwnerId == userId);
        
        if (column == null)
        {
            return Results.NotFound();
        }

        db.Columns.Remove(column);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}