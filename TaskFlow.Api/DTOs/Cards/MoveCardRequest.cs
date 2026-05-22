namespace TaskFlow.Api.DTOs.Cards;

public class MoveCardRequest
{
    public Guid ColumnId { get; set; }
    public int Position { get; set; }
}