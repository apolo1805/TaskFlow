using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using System.Security.Claims;
using TaskFlow.Api.Models;
using TaskFlow.Api.DTOs.Cards;

namespace TaskFlow.Api.Endpoints;

public static class CardEndpoints
{
    public static void MapCardEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/cards").RequireAuthorization();

        group.MapGet("/column/{columnId}", GetCards);
        group.MapPost("/", CreateCard);
        group.MapPut("/{id}", UpdateCard);
        group.MapPatch("/{id}/move", MoveCard);
        group.MapDelete("/{id}", DeleteCard);
    }

    // ------- Get all cards in a column -------
    static async Task<IResult> GetCards(
        Guid columnId,
        AppDbContext db,
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Verify the column belongs to the user via board owenership
        var columnExists = await db.Columns
            .Include(c => c.Board)
            .AnyAsync(c => c.Id == columnId && c.Board.OwnerId == userId);

        if (!columnExists)        
        {
            return Results.NotFound();
        }
        
        var cards = await db.Cards
            .Where(c => c.ColumnId == columnId)
            .OrderBy(c => c.Position)
            .Select(c => new CardDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                Position = c.Position
            })
            .ToListAsync();

        
        return Results.Ok(cards);
    }

    // -------- Create a card -------------
    static async Task<IResult> CreateCard(
        CreateCardRequest request, 
        AppDbContext db,
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var columnExists = await db.Columns
            .Include(c => c.Board)
            .AnyAsync(c => c.Id == request.ColumnId && c.Board.OwnerId == userId);
        
        if (!columnExists)
        {
            return Results.NotFound();
        }

        // new card goes at the bottom of the column
        var maxPosition = await db.Cards
            .Where(c => c.ColumnId == request.ColumnId)
            .MaxAsync(c => (int?)c.Position) ?? -1;
        
        var card = new Card
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ColumnId = request.ColumnId,
            Position = maxPosition + 1
        };

        db.Cards.Add(card);
        await db.SaveChangesAsync();

        return Results.Created($"/api/cards/{card.Id}", new CardDto
        {
            Id = card.Id,
            Title = card.Title,
            Description = card.Description,
            Position = card.Position,
            DueDate = card.DueDate,
            ColumnId = card.ColumnId,
            CreatedAt = card.CreatedAt
        });
    }

    // -------- Update a card -------------
    static async Task<IResult> UpdateCard(
        Guid id,
        UpdateCardRequest request,
        AppDbContext db,
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var card = await db.Cards
            .Include(c => c.Column).ThenInclude(col => col.Board)
            .FirstOrDefaultAsync(c => c.Id == id && c.Column.Board.OwnerId == userId);

        if (card is null)
        {
            return Results.NotFound();
        }

        card.Title = request.Title.Trim();
        card.Description = request.Description?.Trim();
        card.DueDate = request.DueDate;

        await db.SaveChangesAsync();

        return Results.Ok(new CardDto
        {
            Id = card.Id,
            Title = card.Title,
            Description = card.Description,
            Position = card.Position,
            DueDate = card.DueDate,
            ColumnId = card.ColumnId,
            CreatedAt = card.CreatedAt
        });
    }

    // -------- Move a card -------------
    static async Task<IResult> MoveCard(
        Guid id,
        MoveCardRequest request,
        AppDbContext db,
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var card = await db.Cards
            .Include(c => c.Column).ThenInclude(col => col.Board)
            .FirstOrDefaultAsync(c => c.Id == id && c.Column.Board.OwnerId == userId);

        if (card is null)
        {
            return Results.NotFound();
        }

        // verify target column belongs to the same user
        var targetColumn = await db.Columns
            .Include(c => c.Board)
            .FirstOrDefaultAsync(c => c.Id == request.ColumnId && c.Board.OwnerId == userId);
        
        if (targetColumn is null)
        {
            return Results.NotFound();
        }

        // shift existing cards in the target column to make room
        var cardsToShift = await db.Cards
            .Where(c => c.ColumnId == request.ColumnId && c.Position >= request.Position)
            .ToListAsync();
        
        foreach(var c in cardsToShift)
        {
            c.Position++;
        }

        // move the card
        card.ColumnId = request.ColumnId;
        card.Position = request.Position;

        await db.SaveChangesAsync();

        return Results.Ok(new CardDto
        {
            Id = card.Id,
            Title = card.Title,
            Description = card.Description,
            Position = card.Position,
            DueDate = card.DueDate,
            ColumnId = card.ColumnId,
            CreatedAt = card.CreatedAt
        });
    }

    // -------- Delete a card -------------
    static async Task<IResult> DeleteCard(
        Guid id,
        AppDbContext db,
        ClaimsPrincipal user)
    {
        var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var card = await db.Cards
            .Include(c => c.Column).ThenInclude(col => col.Board)
            .FirstOrDefaultAsync(c => c.Id == id && c.Column.Board.OwnerId == userId);

        if (card is null)
        {
            return Results.NotFound();
        }

        db.Cards.Remove(card);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}