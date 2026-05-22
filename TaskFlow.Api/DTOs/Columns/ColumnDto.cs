namespace TaskFlow.Api.DTOs.Columns;

public class ColumnDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int Position { get; set; }
    public Guid BoardId { get; set; }
    public DateTime CreatedAt { get; set; }
}