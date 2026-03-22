# Strategic Command Worklog Portal

The Strategic Command Worklog Portal is a full-stack web application built to streamline work logging, project management, team reviews, and admin oversight. It features a modern F1-inspired command-center UI, a Node.js/Express backend, and **Google Sheets as the data layer** — no separate database required.

## Architecture

This is a monorepo with two main parts:

- **`client/`** — Frontend (React, Vite, TypeScript, Vanilla CSS)
- **`server/`** — Backend API (Node.js, Express, TypeScript, Google Sheets API)

Data is stored and read entirely from **Google Sheets** via a Google Service Account, making the app easy to inspect, share, and manage without a database.

---

## Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A **Google Cloud Service Account** with the Sheets API enabled and a `credentials.json` key file

### 1. Clone the Repository
```bash
git clone https://github.com/SriRam2105-k/strategic-command-worklog-portal.git
cd strategic-command-worklog-portal
```

### 2. Install All Dependencies
```bash
npm run install:all
```

### 3. Configure the Server

Create `server/.env` (copy from `server/.env.example`):
```env
PORT=3001
JWT_SECRET="your-secure-random-secret"
```

Place your Google Service Account key file at:
```
server/credentials.json
```
> ⚠️ Never commit `credentials.json` or `.env` — they are already in `.gitignore`.

### 4. Configure the Client

Create `client/.env.local` (copy from `client/.env.local.example`):
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 5. Run the App

Start both frontend and backend concurrently:
```bash
npm run dev
```

Or start them individually:
```bash
npm run dev:client   # Frontend on http://localhost:5173
npm run dev:server   # Backend on http://localhost:3001
```

---

## Deployment

### Frontend (GitHub Pages)
The frontend (`client/` folder) is automatically deployed to **GitHub Pages** whenever you push to the `main` branch. 
- **URL**: `https://sriram2105-k.github.io/strategic-command-worklog-portal/`
- **Automation**: Managed by the `.github/workflows/deploy.yml` action.

### Backend (Required for functionality)
> [!IMPORTANT]
> **GitHub Pages ONLY hosts the frontend.**  
> The backend (`server/` folder) must be hosted on a service that supports Node.js:
> - **Render** / **Railway** / **Fly.io**
> 
> Without a deployed backend, the frontend will load, but features like logging in and worklog submissions will fail because they cannot reach the server.

---

*Never commit `.env`, `.env.local`, or `credentials.json` to GitHub.*
