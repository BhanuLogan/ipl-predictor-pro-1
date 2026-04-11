# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev:all       # Start both frontend (Vite :5173) and backend (Express :3001) concurrently
npm run dev           # Frontend only
npm run dev:server    # Backend only (with auto-reload)
```

### Build & Lint
```bash
npm run build         # Production frontend build
npm run lint          # ESLint
```

### Tests
```bash
npm run test          # Run Vitest once
npm run test:watch    # Vitest in watch mode
```

### Backend standalone
```bash
cd server && npm start        # Production
cd server && npm run dev      # Dev with auto-reload
```

## Environment Setup

**Frontend** (root `.env`):
```
VITE_API_URL=http://localhost:3001
```

**Backend** (`server/.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_PASSWORD=...
ADMIN_USERNAME=Admin
ADMIN_DEFAULT_PW=...
PORT=3001
```

## Architecture

### Stack
- **Frontend**: React 18 + TypeScript + Vite (SWC), Tailwind CSS, Radix UI / shadcn-ui, React Router v6, Socket.IO client
- **Backend**: Express.js, PostgreSQL (schema auto-created on startup), Socket.IO server, JWT auth
- **External API**: ESPN Cricinfo free API (`site.api.espn.com/apis/site/v2/sports/cricket/8048`) — no key required

### Key directories
```
src/
  pages/        # Route-level components: Index (dashboard), ChatRoom, Admin, Login, Rooms, Profile
  components/   # UI components; dashboard/ holds OpenPolls, CompletedMatches, UpcomingMatches
  lib/
    api.ts      # All HTTP calls; manages JWT in localStorage; single `api` export
    auth.tsx    # AuthContext / useAuth — wraps api.login/register
    room.tsx    # RoomContext / useRoom — active room state
    socket.ts   # Lazy Socket.IO init; getSocket() / connectSocket()
    data.ts     # IPL_SCHEDULE (70 matches), IPL_TEAMS, getPollOpenMatches(), isVotingLocked()
server/
  index.js      # Everything: DB init, all routes, Socket.IO, live score polling, chatbot
```

### Poll open logic (`src/lib/data.ts: getPollOpenMatches`)
A match's poll only opens after the previous match has a saved result. Doubleheader same-day matches open together. Manual `match_overrides` can force-open or force-lock any match. This is the gating mechanism for the whole voting flow — changes here affect what appears on the dashboard.

### Live score & result sync loop (`server/index.js`)
`pollLiveScores()` runs every 5 seconds:
1. Fetches ESPN events for today's matches
2. Emits `live_score` socket events (frontend updates scores in real-time)
3. When `apiMatch.state === 'post'`: adds to `resultTriggerSet` and calls `checkRecentMatches(true)` immediately

`checkRecentMatches(isManual)` saves results to DB, then:
- Calls `invalidateResultsCache()` to flush the in-memory completed-IDs cache
- Emits `result_updated` socket event so connected clients call `loadData()`
- Posts a win announcement bot message to all rooms

Auto-sync (non-manual) only runs in the window `[match_start + 4h, match_start + 6h]`. Manual sync (Admin button or post-trigger) runs for any match that has started.

### Socket.IO event map
| Event | Direction | Description |
|---|---|---|
| `live_score` | server→all | Live score update for a match |
| `result_updated` | server→all | Match result saved; clients reload |
| `new_message` | server→room | Chat message in `chat_{roomId}_{matchId}` |
| `online_users` | server→room | User presence in `chat_{roomId}_{matchId}` |
| `reaction_update` | server→room | Message reaction change |
| `bot_settings_update` | server→all | Bot enabled/disabled for a match |

### Admin flow
Admin access is a two-step process: normal login, then `POST /api/admin/unlock` with `ADMIN_PASSWORD`. This upgrades the JWT to include admin claims. The frontend stores the upgraded token in `localStorage.ipl_token`.

### Commentary bot (Kira)
`pollCommentary()` runs per-match when `commentaryCache` has an `espnEventId`. It hits the ESPN playbyplay endpoint and posts ball-by-ball messages via `formatESPNCommentaryItem()`. First poll seeds all existing items as seen (no backfill). Subsequent polls post only new items. Bot is enabled/disabled per match via `match_bot_settings` table.

## Git Remotes
- `origin` → `BhanuLogan/ipl-predictor-pro` (personal fork)
- `upstream` → `BhanuLogan/ipl-predictor-pro-1` (fork used for PRs to Manohar)
- `manohar` → `Manohar0077/ipl-predictor-pro` (upstream repo)

Push to `upstream` before creating/updating PRs against `Manohar0077/ipl-predictor-pro`.
