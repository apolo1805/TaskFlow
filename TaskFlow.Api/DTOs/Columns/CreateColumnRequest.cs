namespace TaskFlow.Api.DTOs.Columns;

public class CreateColumnRequest
{
    public string Name { get; set; } = null!;
    public Guid BoardId { get; set; }
}