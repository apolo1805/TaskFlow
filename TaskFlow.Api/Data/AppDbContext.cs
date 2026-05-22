using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Data;

public class AppDbContext : DbContext
{
   public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
   {
   }

    public DbSet<User> Users { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<Column> Columns { get; set; }
    public DbSet<Card> Cards { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<Board>(e =>
        {
            e.HasKey(b => b.Id);
            e.Property(b => b.Name).IsRequired().HasMaxLength(200);

            e.HasOne(b => b.Owner)
                .WithMany(u => u.Boards)
                .HasForeignKey(b => b.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Column>(e =>
        {
           e.HasKey(c => c.Id);
           e.Property(c => c.Name).IsRequired().HasMaxLength(100);

           e.HasOne(c => c.Board)
               .WithMany(b => b.Columns)
               .HasForeignKey(c => c.BoardId)
               .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Card>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Title).IsRequired().HasMaxLength(500);

            e.HasOne(c => c.Column)
                .WithMany(col => col.Cards)
                .HasForeignKey(c => c.ColumnId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}