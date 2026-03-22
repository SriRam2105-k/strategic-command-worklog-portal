# Application Operation Guide

This guide provides step-by-step instructions on how to run the Strategic Command Worklog Portal and how to add entries (worklogs).

## 1. Initial Setup
The application uses **Google Sheets** as its database. No separate database installation is required.
- Ensure you have the `server/credentials.json` file (Google Service Account key).
- Ensure your Google Sheet is shared with the email address in that credentials file.

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

### Manual Command Line Instructions
If you prefer running commands manually, follow these steps:

#### Step A: Installation (First Time Only)
Run this command in the project root folder:
```bash
npm run install:all
```

#### Step B: Start the Backend (Server)
Open a terminal in the `server` directory and run:
```bash
npm run dev
```
Wait for: `Server running on http://localhost:3001`

#### Step C: Start the Frontend (Website)
Open a terminal in the `client` directory and run:
```bash
npm run dev
```

---

## 3. How to Add a Worklog Entry
Follow these steps to log your work:

1. **Login**:
   - Use your **Roll Number** and **Password** (stored in your Google Sheet).
2. **Dashboard**: View your dashboard overview and recent activities.
3. **Navigate to Worklogs**: Click on **"Worklogs"** in the sidebar.
4. **Submit Entry**:
   - Select the **Date**.
   - Enter the **Hours** worked.
   - Provide a **Description** of your tasks.
   - Click **"Submit Worklog"**.
5. **Sync with Sheets**:
   - The application writes directly to your Google Sheet in real-time.
   - For admins, the dashboards reflect the latest data from the sheet.

---

## 4. Troubleshooting
- **Port Conflicts (3001)**: If you see an error, the backend is likely still running in another window. Close all Command Prompt windows and try again.
- **Google Sheets Errors**: Ensure `credentials.json` is present in the `server` folder and that the Service Account has "Editor" access to your target spreadsheet.
- **Missing Env Vars**: Ensure `server/.env` and `client/.env.local` exist (copy them from the `.example` files).

---
