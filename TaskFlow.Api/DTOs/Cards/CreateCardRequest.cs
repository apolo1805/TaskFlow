namespace TaskFlow.Api.DTOs.Cards;

public class CreateCardRequest
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public Guid ColumnId { get; set; }
}