namespace TaskFlow.Api.DTOs.Boards;

public class UpdateBoardRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}