# TaskFlow

A Kanban task manager built with React + TypeScript on the frontend
and ASP.NET Core 8 Minimal API + EF Core + SQLite on the backend.

## Getting started

### Backend
\```bash
cd TaskFlow.Api
cp appsettings.Development.example.json appsettings.Development.json
# fill in your JWT key in the new file
dotnet ef database update
dotnet run
\```

### Frontend
\```bash
cd taskflow-client
npm install
npm run dev
\```