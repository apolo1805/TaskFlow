namespace TaskFlow.Api.DTOs.Cards;

public class UpdateCardRequest
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
}