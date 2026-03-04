# Backend Setup Instructions

The backend is located in the `server` directory.

## Prerequisites
- Node.js installed.
- Terminal access.

## Quick Setup
From the root directory, run:
```bash
npm run db:setup
```
This will install dependencies, create the SQLite database, and seed initial data.

## Running the Servers
1. **Frontend**: `npm run dev` (Runs on http://localhost:5173)
2. **Backend**: `npm run server` (Runs on http://localhost:3001)

You need to run BOTH in separate terminals.

### Troubleshooting: PowerShell "Script Disabled" Error
If you see an error like `cannot be loaded because running scripts is disabled on this system`, it means PowerShell is blocking the script execution. 

**Solution:**
We have created batch files for you to simply double-click:
- `setup_database.bat` (Run this first to set up everything)
- `start_backend.bat` (Starts the backend)
- `start_frontend.bat` (Starts the frontend)

Using these files avoids the PowerShell restrictions.

## Manual Setup (if scripts fail)
1. `cd server`
2. `npm install`
3. `npx prisma migrate dev --name init`
4. `npm run seed`
5. `npm run dev`
