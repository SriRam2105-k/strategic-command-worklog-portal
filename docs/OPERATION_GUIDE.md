# Application Operation Guide

This guide provides step-by-step instructions on how to run the Strategic Command Worklog Portal and how to add entries (worklogs).

## 1. Initial Setup
If this is your first time running the application, you need to set up the database.
- Double-click `setup_database.bat` in the root folder.
- *This installs dependencies and prepares the SQLite database.*

## 2. Running the Application
You need to run **BOTH** the Backend and the Frontend simultaneously.

### Using Batch Files (Recommended for Windows)
#### Step A: Start the Backend (Server)
- Double-click `start_backend.bat`.
- Keep this window open. The backend runs on `http://localhost:3001`.

#### Step B: Start the Frontend (Website)
- Double-click `start_frontend.bat`.
- Keep this window open. The frontend runs on `http://localhost:5173`.
- Open your browser and go to `http://localhost:5173`.

### Manual Command Line Instructions (Command Prompt / CMD)
If you prefer running commands manually or are on a non-Windows system, open your **Command Prompt (cmd.exe)** or terminal and follow these steps:

#### Step A: Setup (First Time Only)
Run these commands in the project root folder:
```cmd
cd server
npm install
npx prisma migrate dev --name init
npm run seed
cd ..
```

#### Step B: Start the Backend (Server)
Open a **new** Command Prompt window and run:
```cmd
cd server
npm run dev
```
Wait for the message: `Server running on http://localhost:3001`

#### Step C: Start the Frontend (Website)
Open another **new** Command Prompt window and run:
```cmd
cd client
npm run dev
```
The website will be available at `http://localhost:5173`.

### Viewing/Editing the Database (Prisma Studio)
To view the database (SQLite) in a visual editor, run:
1. Open a terminal in the `server` directory.
2. Run:
```cmd
npx prisma studio
```
This will open a browser window at `http://localhost:5555` where you can view and edit all database records.

---

## 3. Supabase Hosting (New)
The application is now ready to be hosted on **Supabase**.

### Step A: Set up Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to Project Settings -> Database -> Connection string.
3. Copy the **URI** (ensure you use the transaction pooler if planning to use serverless functions).

### Step B: Configure Environment Variables
In your `server/.env` file, add:
```env
DATABASE_URL=postgresql://postgres.xxxx:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step C: Initialize Database
Run the following command in the `server` directory to push the schema to Supabase:
```cmd
npx prisma db push
```
Then seed the database:
```cmd
npm run seed
```

---

## 4. How to Add a Worklog Entry
Follow these steps to log your work:

1. **Login**:
   - Use your **Roll Number** and **Password**.
   - (Demo Student: `OP-101` / `1234`)
   - (Demo Admin: `ADM-001` / `admin`)
2. **Dashboard**: Once logged in, you will see your dashboard overview.
3. **Navigate to Worklogs**: Click on **"Worklogs"** in the sidebar.
4. **Submit Entry**:
   - Select the **Date**.
   - Enter the **Hours** worked.
   - Provide a **Description** of your tasks.
   - Click **"Submit Worklog"**.
5. **Sync with Sheets (Admin)**:
   - Admins can trigger a synchronization with Google Sheets by clicking the **Refresh** icon in the header or sidebar.
   - The data is stored in the local SQLite database and synchronized with the configured Google Sheets URL.

---

## 4. Troubleshooting
- **Port Conflicts (EADDRINUSE: :::3001)**: If you see this error, it means the backend is already running (perhaps in a hidden window).
  - **Quick Fix**: Close all open Command Prompt windows and try again.
  - **Manual Fix (Windows)**:
    1. Open Command Prompt and run:
       ```cmd
       netstat -ano | findstr :3001
       ```
    2. Look at the number in the last column (the Process ID).
    3. Run this to kill it (replace `PID` with that number):
       ```cmd
       taskkill /F /PID PID
       ```
- **Database Errors**: If the database seems out of sync, run `setup_database.bat` again (Warning: this may reset local data).
- **Google Sheets Link**: Admins can update the Google Sheets Deployment URL in the Login page settings (gear icon) if the connection is failing.
- **Turso Connection**: If the backend fails to start with Turso, ensure your `TURSO_DATABASE_URL` starts with `libsql://`. If environment variables are missing, it will automatically fall back to the local `dev.db`.
