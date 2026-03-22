# Strategic Command Worklog Portal

The Strategic Command Worklog Portal is a full-stack application designed to streamline work logging, project management, and cross-team reviews. It features a modern interface, a secure backend, and integrations with Supabase (database) and AI services.

## Architecture
The repository is set up a monorepo containing two main parts:
- **`client/`**: The frontend application (React, Vite, Vanilla CSS).
- **`server/`**: The backend API server (Node.js, Express, Prisma ORM, Supabase PostgreSQL).

## Getting Started Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation
1. Clone the repository to your local machine:
   ```bash
   git clone <your-github-repo-url>
   cd strategic-command-worklog-portal
   ```

2. Install all dependencies across the root, client, and server:
   ```bash
   npm run install:all
   ```

### Environment Variables
You need to set up your environment variables for both the client and the server.

**Client Environment Variables (`client/.env.local`)**
Create a `.env.local` file in the `client` directory and configure the necessary variables (like your Supabase URI and API keys):
```env
VITE_API_URL=http://localhost:3000
# Add your Supabase and Gemini API variables here as needed
```

**Server Environment Variables (`server/.env`)**
Create a `.env` file in the `server` directory and configure your Database URL:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:<password>@<supabase-host>:5432/postgres"
# Add your Gemini API variables here
```

### Database Setup (Supabase / Prisma)
Before running the app, make sure your database schema is pushed to Supabase and seeded:
```bash
npm run db:setup
```

### Running the Application

To start both the client and server concurrently in development mode, simply run:
```bash
npm run dev
```
Alternatively, you can start them individually:
- Frontend only: `npm run dev:client`
- Backend only: `npm run dev:server`

## Deployment

### Hosting the Frontend
The frontend (`client/` folder) is a statically built web app and can be deployed directly to free hosting services like:
- **Vercel**
- **Netlify**
- **GitHub Pages**
*(Build Command: `npm run build`, Output Directory: `dist`)*

### Hosting the Backend
The backend (`server/` folder) needs to run on a Node.js server. Popular options include:
- **Render**
- **Railway**
- **Heroku**
*(Start Command: `node index.js` or `npm start` inside the `server` folder)*

### Hosting the Database
The project is configured to use **Supabase** (PostgreSQL) as its database.

---
*Note: Make sure to never commit your `.env` or `.env.local` files to GitHub. They should be added to your `.gitignore` file.*
