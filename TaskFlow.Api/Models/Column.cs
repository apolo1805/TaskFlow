
namespace TaskFlow.Api.Models;

public class Column
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = null!;
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid BoardId { get; set; }
    public Board Board { get; set; } = null!;

    public ICollection<Card> Cards { get; set; } = [];
}