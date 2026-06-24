# ERP System

## Tech Stack
- Frontend: Vuexy HTML (Bootstrap 5, Vanilla JS)
- Backend: .NET 8 Web API
- Database: MySQL 8 (Docker)

## How to Run

### 1. Database (Docker)
```bash
docker-compose up -d
```
This will start MySQL on port 3306.

### 2. Backend (.NET 8 Web API)
```bash
cd backend/ErpApi
dotnet ef database update
dotnet run
```
The API will run on `https://localhost:5001` or `http://localhost:5000`.

### 3. Frontend (HTML)
Serve the `frontend/` directory using any static web server.
For example, with VS Code Live Server, open `frontend/html/vertical-menu-template/auth-login-basic.html` and start the server.

## Default Credentials
- **Email:** `superadmin@erp.local`
- **Password:** `Admin@123`

## Architecture
- The frontend makes AJAX calls to the .NET 8 Web API.
- Authentication is handled via JWT tokens stored in `localStorage`.
- Protected pages use `auth.js` to redirect unauthenticated users to the login page.
