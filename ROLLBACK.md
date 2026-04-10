# Rollback Plan — feature/live-scores-chatbot

This document describes how to fully revert the changes introduced by the
`feature/live-scores-chatbot` branch if a rollback is needed in production.

---

## What was changed

| Layer | Change |
|---|---|
| **Database** | New tables: `message_reactions`, `match_bot_settings` |
| **Database** | New columns: `results.toss`, `chat_messages.bot_name`, `chat_messages.reply_to_id` |
| **Database** | New bot user: `scorebot` |
| **Server** | Live score polling (Cricbuzz API, no external dependency) |
| **Server** | Ball-by-ball commentary polling |
| **Server** | `/BotName` slash command handler |
| **Server** | Reactions API (`POST /api/reactions`) |
| **Server** | Bot settings API (`GET/POST /api/match-bot-settings`) |
| **Frontend** | ChatRoom rewrite (bot messages, reactions, bot commands) |
| **Frontend** | Live score display on match cards |
| **Frontend** | Completed match "View Chat" links |
| **Frontend** | Admin bot on/off toggle per match |

---

## Rollback Steps

### 1. Stop the server

```bash
# Kill the running Node process
pkill -f "node server/index.js"
# or if using npm run dev:all
pkill -f concurrently
```

### 2. Revert the database

Run the rollback script against the production database:

```bash
psql "$DATABASE_URL" -f rollback.sql
```

This will:
- Delete all bot messages and their reactions
- Remove the `scorebot` user
- Drop `message_reactions` and `match_bot_settings` tables
- Drop `toss`, `bot_name`, and `reply_to_id` columns
- Run an assertion check to confirm success

> **Note:** This is irreversible. Bot chat history and reactions will be permanently deleted.
> Take a DB snapshot before running if you want to preserve the data.

### 3. Revert the application code

```bash
# Revert to the last commit before this feature was merged
git revert --no-commit f8f2ffd..HEAD   # adjust commit hash to the merge commit
git commit -m "revert: rollback feature/live-scores-chatbot"
```

Or hard reset to the commit before the merge (only if branch has not been
pushed to a shared remote):

```bash
git reset --hard <commit-before-merge>
```

### 4. Restart the server

```bash
npm run dev:all          # development
# or in production:
node server/index.js
```

---

## Verification

After rollback, confirm:

- [ ] `SELECT * FROM information_schema.tables WHERE table_name IN ('message_reactions','match_bot_settings');` returns 0 rows
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='results' AND column_name='toss';` returns 0 rows
- [ ] App loads without errors
- [ ] Match cards show no live score banners
- [ ] Chat rooms load (no bot messages, no reaction UI)
- [ ] Admin page shows no bot toggle

---

## DB Snapshot

A full database snapshot taken before the rollback plan was created is available at:

```
db-dump.sql   (in this repository root)
```

To restore from the snapshot:

```bash
psql "$DATABASE_URL" < db-dump.sql
```

---

## Contacts

If you need help executing this rollback, contact the branch author via
the PR comments on [Manohar0077/ipl-predictor-pro#4](https://github.com/Manohar0077/ipl-predictor-pro/pull/4).
