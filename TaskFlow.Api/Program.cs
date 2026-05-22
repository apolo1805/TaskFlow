using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Api.Data;
using TaskFlow.Api.Endpoints;
using TaskFlow.Api.Services;
using TaskFlow.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ------------------- Datebase -------------------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ------------------- JWT Authentication -------------------
var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtService>();

// ------------------- CORS -------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("Dev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ------------------- App -------------------
var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

// --- Middleware pipeline (ORDER MATTERS) ---
app.UseCors("Dev");      // 1. CORS header first - before any response is written
app.UseAuthentication(); // 2. Parse and validate the JWT
app.UseAuthorization();  // 3. Check if the user is allowed to hit this endpoint

// Endpoints (we'll fill these in next)
app.MapAuthEndpoints();
app.MapBoardEndpoints();
app.MapColumnEndpoints();
app.MapCardEndpoints();

app.MapGet("/", () => "Welcome to TaskFlow API!");

app.Run();