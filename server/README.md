# IPL Predictor 2026 — Backend Server

Self-hosted Node.js/Express API with PostgreSQL.

## Quick Start

```bash
cd server
npm install
npm start
```

Server runs on the `PORT` defined in `.env`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | yes | Server port |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | JWT signing secret |
| `ADMIN_PASSWORD` | yes | Password to unlock admin access |
| `ADMIN_USERNAME` | yes | Seeded admin username |
| `ADMIN_DEFAULT_PW` | yes | Seeded admin account password |

Create a `.env` file before starting the server. You can copy `.env.example` and fill in your values.

## Local PostgreSQL Setup

1. Create a PostgreSQL database
2. Create `.env` from the example and set your values:

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` in `.env`, for example:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ipl_predictor
```

4. Start the server:

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
