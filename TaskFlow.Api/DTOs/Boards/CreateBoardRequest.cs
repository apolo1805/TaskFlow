namespace TaskFlow.Api.DTOs.Boards;

public class CreateBoardRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}