# IPL Predictor 2026 — Backend Server

Self-hosted Node.js/Express API with SQLite.

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
| `JWT_SECRET` | `ipl2026-secret-change-me` | JWT signing secret (CHANGE THIS!) |
| `ADMIN_PASSWORD` | `ipl2026` | Password to unlock admin access |

## Deploy

1. Copy the `server/` folder to your VPS
2. Run `npm install`
3. Set environment variables (especially `JWT_SECRET`)
4. Run `npm start` (use PM2 or systemd for production)
5. Set `VITE_API_URL` in the frontend to your server URL

## API Endpoints

- `POST /api/register` — `{ email, username, password }`
- `POST /api/login` — `{ email, password }`
- `GET /api/me` — Get current user (auth required)
- `POST /api/admin/unlock` — `{ password }` (auth required)
- `GET /api/votes` — All votes grouped by match
- `POST /api/vote` — `{ matchId, prediction }` (auth required)
- `GET /api/results` — All match results
- `POST /api/result` — `{ matchId, winner }` (admin only)
- `GET /api/leaderboard` — Sorted leaderboard

## Database

SQLite file `ipl.db` is auto-created on first run. Back it up periodically.
