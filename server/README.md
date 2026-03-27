# IPL Predictor 2026 — Backend Server

Self-hosted Node.js/Express API with PostgreSQL.

## Quick Start

```bash
cd server
npm install
npm start
```

Server runs on `http://localhost:3001` by default.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | none | PostgreSQL connection string |
| `JWT_SECRET` | `ipl2026-secret-change-me` | JWT signing secret (CHANGE THIS!) |
| `ADMIN_PASSWORD` | `ipl2026` | Password to unlock admin access |
| `ADMIN_USERNAME` | `Admin` | Seeded admin username |
| `ADMIN_DEFAULT_PW` | `admin123` | Seeded admin account password |

## Local PostgreSQL Setup

1. Create a PostgreSQL database
2. Set `DATABASE_URL`, for example:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ipl_predictor"
```

3. Start the server:

```bash
npm start
```

The app auto-creates tables on boot and seeds the default admin user if it does not exist.

## Deploy

1. Copy the `server/` folder to your VPS
2. Run `npm install`
3. Provision PostgreSQL and set `DATABASE_URL`
4. Set environment variables (especially `JWT_SECRET`)
5. Run `npm start` (use PM2 or systemd for production)
6. Set `VITE_API_URL` in the frontend to your server URL

## API Endpoints

- `POST /api/register` — `{ username, password }`
- `POST /api/login` — `{ username, password }`
- `GET /api/me` — Get current user (auth required)
- `POST /api/admin/unlock` — `{ password }` (auth required)
- `GET /api/votes` — All votes grouped by match
- `GET /api/vote-counts` — Anonymous vote totals grouped by match
- `POST /api/vote` — `{ matchId, prediction }` (auth required)
- `GET /api/results` — All match results
- `POST /api/result` — `{ matchId, winner }` (admin only)
- `POST /api/admin/vote` — Admin update a user's vote
- `POST /api/admin/delete-vote` — Admin delete a user's vote
- `POST /api/admin/reset` — Clear votes and results
- `GET /api/leaderboard` — Sorted leaderboard

## Database

Data is stored in PostgreSQL. The backend no longer uses a local SQLite file.
