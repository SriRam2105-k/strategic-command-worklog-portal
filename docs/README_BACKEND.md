# Backend Setup Instructions

The backend is located in the `server` directory.

## Prerequisites
- Node.js (v18+)
- Google Cloud Service Account with Sheets API enabled.

## Environment Variables
Create a `.env` file in the `server` folder:
```env
PORT=3001
JWT_SECRET="your-secure-random-secret"
```

## Google Credentials
Download your Service Account JSON key as `credentials.json` and place it in the `server` folder.

## Running the Server
From the root directory, you can run:
```bash
npm run dev:server
```
Or inside the `server` directory:
```bash
npm install
npm run dev
```

The server handles authentication, session management, and directly integrates with **Google Sheets** for data storage. No separate database (SQLite/Postgres) is required.
