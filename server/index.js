const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const app = express();
const PORT = Number(requireEnv("PORT"));
const JWT_SECRET = requireEnv("JWT_SECRET");
const ADMIN_PASSWORD = requireEnv("ADMIN_PASSWORD");
const DATABASE_URL = requireEnv("DATABASE_URL");
const ADMIN_USERNAME = requireEnv("ADMIN_USERNAME");
const ADMIN_DEFAULT_PW = requireEnv("ADMIN_DEFAULT_PW");

if (Number.isNaN(PORT)) {
  throw new Error("PORT must be a valid number");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      match_id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prediction TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(match_id, user_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS results (
      match_id TEXT PRIMARY KEY,
      winner TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const existing = await queryOne(
    "SELECT id FROM users WHERE username = $1",
    [ADMIN_USERNAME]
  );

  if (!existing) {
    const hash = bcrypt.hashSync(ADMIN_DEFAULT_PW, 10);
    await query(
      "INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, TRUE)",
      [ADMIN_USERNAME, hash]
    );
    console.log(`Default admin created: ${ADMIN_USERNAME} / ${ADMIN_DEFAULT_PW}`);
  }

  // ── Rooms ──
  await query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS room_members (
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (room_id, user_id)
    );
  `);

  // Seed STAGS room (idempotent)
  await query(`
    INSERT INTO rooms (name, invite_code, created_by)
    VALUES ('STAGS', 'STAGS1', (SELECT id FROM users WHERE username = 'manoharcb' LIMIT 1))
    ON CONFLICT (name) DO NOTHING
  `);

  // Fix STAGS creator to manoharcb (for existing rows)
  await query(`
    UPDATE rooms SET created_by = (SELECT id FROM users WHERE username = 'manoharcb' LIMIT 1)
    WHERE name = 'STAGS'
  `);

  // Add all existing non-admin users to STAGS (idempotent)
  await query(`
    INSERT INTO room_members (room_id, user_id)
    SELECT r.id, u.id FROM rooms r, users u
    WHERE r.name = 'STAGS' AND NOT u.is_admin
    ON CONFLICT DO NOTHING
  `);
}

app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin only" });
  next();
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((err) => {
      console.error(err);
      next(err);
    });
  };
}

app.post("/api/register", asyncRoute(async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      return res.status(400).json({ error: "Username must be 2-20 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await queryOne(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, is_admin`,
      [trimmedUsername, hash]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, user });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ error: "Username already taken" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
}));

app.post("/api/login", asyncRoute(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = await queryOne(
    "SELECT * FROM users WHERE username = $1",
    [username.trim()]
  );
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
    },
  });
}));

app.get("/api/me", authMiddleware, asyncRoute(async (req, res) => {
  const user = await queryOne(
    "SELECT id, username, is_admin FROM users WHERE id = $1",
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}));

app.post("/api/admin/unlock", authMiddleware, asyncRoute(async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Wrong admin password" });
  }

  await query("UPDATE users SET is_admin = TRUE WHERE id = $1", [req.user.id]);
  const token = jwt.sign({ ...req.user, is_admin: true }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, message: "Admin access granted" });
}));

app.get("/api/votes", authMiddleware, asyncRoute(async (req, res) => {
  const rows = await query(`
    SELECT v.match_id, u.username, v.prediction
    FROM votes v
    JOIN users u ON v.user_id = u.id
  `);

  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.match_id]) grouped[r.match_id] = {};
    grouped[r.match_id][r.username] = r.prediction;
  }
  res.json(grouped);
}));

app.get("/api/vote-counts", asyncRoute(async (req, res) => {
  const rows = await query(`
    SELECT match_id, prediction, COUNT(*)::int AS cnt
    FROM votes
    GROUP BY match_id, prediction
  `);

  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.match_id]) grouped[r.match_id] = {};
    grouped[r.match_id][r.prediction] = r.cnt;
  }
  res.json(grouped);
}));

app.post("/api/vote", authMiddleware, asyncRoute(async (req, res) => {
  const { matchId, prediction } = req.body;
  if (!matchId || !prediction) {
    return res.status(400).json({ error: "matchId and prediction required" });
  }

  await query(
    `INSERT INTO votes (match_id, user_id, prediction)
     VALUES ($1, $2, $3)
     ON CONFLICT (match_id, user_id)
     DO UPDATE SET prediction = EXCLUDED.prediction`,
    [matchId, req.user.id, prediction]
  );

  res.json({ ok: true });
}));

app.post("/api/admin/vote", authMiddleware, adminMiddleware, asyncRoute(async (req, res) => {
  const { matchId, username, prediction } = req.body;
  if (!matchId || !username || !prediction) {
    return res.status(400).json({ error: "matchId, username, prediction required" });
  }

  const user = await queryOne("SELECT id FROM users WHERE username = $1", [username]);
  if (!user) return res.status(404).json({ error: "User not found" });

  await query(
    `INSERT INTO votes (match_id, user_id, prediction)
     VALUES ($1, $2, $3)
     ON CONFLICT (match_id, user_id)
     DO UPDATE SET prediction = EXCLUDED.prediction`,
    [matchId, user.id, prediction]
  );

  res.json({ ok: true });
}));

app.post("/api/admin/delete-vote", authMiddleware, adminMiddleware, asyncRoute(async (req, res) => {
  const { matchId, username } = req.body;
  if (!matchId || !username) {
    return res.status(400).json({ error: "matchId and username required" });
  }

  const user = await queryOne("SELECT id FROM users WHERE username = $1", [username]);
  if (!user) return res.status(404).json({ error: "User not found" });

  await query("DELETE FROM votes WHERE match_id = $1 AND user_id = $2", [matchId, user.id]);
  res.json({ ok: true });
}));

app.post("/api/admin/reset", authMiddleware, adminMiddleware, asyncRoute(async (req, res) => {
  await query("DELETE FROM votes");
  await query("DELETE FROM results");
  res.json({ ok: true, message: "All votes and results cleared" });
}));

app.get("/api/results", asyncRoute(async (req, res) => {
  const rows = await query("SELECT match_id, winner FROM results");
  const map = {};
  for (const r of rows) map[r.match_id] = r.winner;
  res.json(map);
}));

app.post("/api/result", authMiddleware, adminMiddleware, asyncRoute(async (req, res) => {
  const { matchId, winner } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId required" });

  if (!winner) {
    await query("DELETE FROM results WHERE match_id = $1", [matchId]);
  } else {
    await query(
      `INSERT INTO results (match_id, winner)
       VALUES ($1, $2)
       ON CONFLICT (match_id)
       DO UPDATE SET winner = EXCLUDED.winner`,
      [matchId, winner]
    );
  }

  res.json({ ok: true });
}));

app.get("/api/leaderboard", asyncRoute(async (req, res) => {
  const board = await query(`
    SELECT
      u.username,
      COALESCE(SUM(
        CASE
          WHEN r.winner IS NULL THEN 0
          WHEN r.winner IN ('nr', 'draw') THEN 1
          WHEN v.prediction = r.winner THEN 2
          ELSE 0
        END
      ), 0)::int AS points,
      COALESCE(SUM(
        CASE
          WHEN r.winner IS NOT NULL AND r.winner NOT IN ('nr', 'draw') AND v.prediction = r.winner
          THEN 1
          ELSE 0
        END
      ), 0)::int AS correct,
      COALESCE(COUNT(r.match_id), 0)::int AS total,
      COALESCE(COUNT(v.id), 0)::int AS voted
    FROM users u
    LEFT JOIN votes v ON v.user_id = u.id
    LEFT JOIN results r ON r.match_id = v.match_id
    WHERE NOT u.is_admin
    GROUP BY u.id, u.username
    ORDER BY points DESC, correct DESC, u.username ASC
  `);

  res.json(board);
}));

app.get("/api/users", asyncRoute(async (req, res) => {
  const users = await query("SELECT id, username FROM users ORDER BY username ASC");
  res.json(users);
}));

// ─── Room routes ────────────────────────────────────────────────────────────

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create room
app.post("/api/rooms", authMiddleware, asyncRoute(async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Room name must be at least 2 characters" });
  }
  try {
    const room = await queryOne(
      `INSERT INTO rooms (name, invite_code, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, invite_code`,
      [name.trim(), generateInviteCode(), req.user.id]
    );
    await query(
      `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [room.id, req.user.id]
    );
    res.json(room);
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ error: "Room name already taken" });
    throw e;
  }
}));

// Join room by invite code
app.post("/api/rooms/join", authMiddleware, asyncRoute(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: "Invite code required" });
  const room = await queryOne(
    "SELECT id, name, invite_code FROM rooms WHERE UPPER(invite_code) = UPPER($1)",
    [inviteCode.trim()]
  );
  if (!room) return res.status(404).json({ error: "Invalid invite code" });
  await query(
    `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [room.id, req.user.id]
  );
  res.json({ room });
}));

// My rooms
app.get("/api/rooms/mine", authMiddleware, asyncRoute(async (req, res) => {
  const rooms = await query(`
    SELECT r.id, r.name, r.invite_code, r.created_by,
           COUNT(rm2.user_id)::int AS member_count
    FROM rooms r
    JOIN room_members rm  ON rm.room_id  = r.id AND rm.user_id = $1
    JOIN room_members rm2 ON rm2.room_id = r.id
    GROUP BY r.id, r.name, r.invite_code, r.created_by
    ORDER BY r.name ASC
  `, [req.user.id]);
  res.json(rooms);
}));

// Room leaderboard — register BEFORE /:id to avoid route conflict
app.get("/api/rooms/:id/leaderboard", authMiddleware, asyncRoute(async (req, res) => {
  const roomId = parseInt(req.params.id);
  if (isNaN(roomId)) return res.status(400).json({ error: "Invalid room id" });
  const member = await queryOne(
    "SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2",
    [roomId, req.user.id]
  );
  if (!member && !req.user.is_admin) return res.status(403).json({ error: "Not a member of this room" });
  const board = await query(`
    SELECT
      u.username,
      COALESCE(SUM(
        CASE
          WHEN r.winner IS NULL THEN 0
          WHEN r.winner IN ('nr','draw') THEN 1
          WHEN v.prediction = r.winner THEN 2
          ELSE 0
        END
      ), 0)::int AS points,
      COALESCE(SUM(
        CASE WHEN r.winner IS NOT NULL AND r.winner NOT IN ('nr','draw') AND v.prediction = r.winner THEN 1 ELSE 0 END
      ), 0)::int AS correct,
      COALESCE(COUNT(r.match_id), 0)::int AS total,
      COALESCE(COUNT(v.id), 0)::int AS voted
    FROM users u
    JOIN room_members rm ON rm.user_id = u.id AND rm.room_id = $1
    LEFT JOIN votes v ON v.user_id = u.id
    LEFT JOIN results r ON r.match_id = v.match_id
    WHERE NOT u.is_admin
    GROUP BY u.id, u.username
    ORDER BY points DESC, correct DESC, u.username ASC
  `, [roomId]);
  res.json(board);
}));

// Room details
app.get("/api/rooms/:id", authMiddleware, asyncRoute(async (req, res) => {
  const roomId = parseInt(req.params.id);
  if (isNaN(roomId)) return res.status(400).json({ error: "Invalid room id" });
  const member = await queryOne(
    "SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2",
    [roomId, req.user.id]
  );
  if (!member && !req.user.is_admin) return res.status(403).json({ error: "Not a member of this room" });
  const room = await queryOne("SELECT id, name, invite_code FROM rooms WHERE id = $1", [roomId]);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const members = await query(
    `SELECT u.username FROM users u JOIN room_members rm ON rm.user_id = u.id WHERE rm.room_id = $1 ORDER BY u.username ASC`,
    [roomId]
  );
  res.json({ ...room, members: members.map(m => m.username) });
}));

// Delete room (creator or admin)
app.delete("/api/rooms/:id", authMiddleware, asyncRoute(async (req, res) => {
  const roomId = parseInt(req.params.id);
  if (isNaN(roomId)) return res.status(400).json({ error: "Invalid room id" });
  const room = await queryOne("SELECT id, created_by FROM rooms WHERE id = $1", [roomId]);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (!req.user.is_admin && room.created_by !== req.user.id) {
    return res.status(403).json({ error: "Only the room creator or admin can delete this room" });
  }
  await query("DELETE FROM rooms WHERE id = $1", [roomId]);
  res.json({ ok: true });
}));

// Admin: view all rooms
app.get("/api/admin/rooms", authMiddleware, adminMiddleware, asyncRoute(async (req, res) => {
  const rooms = await query(`
    SELECT r.id, r.name, r.invite_code,
           u.username AS created_by_username,
           COUNT(rm.user_id)::int AS member_count
    FROM rooms r
    LEFT JOIN users u ON u.id = r.created_by
    LEFT JOIN room_members rm ON rm.room_id = r.id
    GROUP BY r.id, r.name, r.invite_code, u.username
    ORDER BY r.name ASC
  `);
  res.json(rooms);
}));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`IPL Predictor API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
