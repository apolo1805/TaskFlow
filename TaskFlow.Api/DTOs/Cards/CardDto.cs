namespace TaskFlow.Api.DTOs.Cards;

public class CardDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int Position { get; set; }
    public DateTime? DueDate { get; set; }
    public Guid ColumnId { get; set; }
    public DateTime CreatedAt { get; set; }
}