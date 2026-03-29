const dotenv = require("dotenv");
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const IPL_SCHEDULE = require("./schedule");

function isVotingLocked(matchId) {
  const match = IPL_SCHEDULE.find((m) => m.id === matchId);
  if (!match) return false;
  const now = new Date();
  const timeStr = match.time || "19:30";
  const lockTime = new Date(`${match.date}T${timeStr}:00+05:30`);
  return now >= lockTime;
}

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

  // Add profile_pic column 
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;
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
       RETURNING id, username, is_admin, profile_pic`,
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
      profile_pic: user.profile_pic,
    },
  });
}));

app.get("/api/me", authMiddleware, asyncRoute(async (req, res) => {
  const user = await queryOne(
    "SELECT id, username, is_admin, profile_pic FROM users WHERE id = $1",
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}));

app.put("/api/me", authMiddleware, asyncRoute(async (req, res) => {
  const { username, password, profile_pic } = req.body;
  const updates = [];
  const params = [req.user.id];
  let paramIdx = 2;

  if (username) {
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return res.status(400).json({ error: "Username must be 2-20 characters" });
    }
    updates.push(`username = $${paramIdx++}`);
    params.push(trimmed);
  }

  if (password) {
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    updates.push(`password_hash = $${paramIdx++}`);
    params.push(await bcrypt.hash(password, 10));
  }

  if (profile_pic !== undefined) {
    updates.push(`profile_pic = $${paramIdx++}`);
    params.push(profile_pic || null);
  }

  if (updates.length > 0) {
    try {
      await query(`UPDATE users SET ${updates.join(", ")} WHERE id = $1`, params);
    } catch (e) {
      if (e.code === "23505") return res.status(400).json({ error: "Username already taken" });
      throw e;
    }
  }

  const updatedUser = await queryOne(
    "SELECT id, username, is_admin, profile_pic FROM users WHERE id = $1",
    [req.user.id]
  );

  const token = jwt.sign(
    { id: updatedUser.id, username: updatedUser.username, is_admin: updatedUser.is_admin },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({ ok: true, token, user: updatedUser });
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
    const locked = isVotingLocked(r.match_id);
    if (!locked && r.username !== req.user.username && !req.user.is_admin) {
      continue;
    }
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
    if (isVotingLocked(r.match_id)) {
      grouped[r.match_id][r.prediction] = r.cnt;
    } else {
      grouped[r.match_id]._total = (grouped[r.match_id]._total || 0) + r.cnt;
    }
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

app.post("/api/admin/sync-results", authMiddleware, adminMiddleware, asyncRoute(async (req, res) => {
  const result = await checkRecentMatches(true);
  res.json(result);
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
      u.profile_pic,
      COALESCE(SUM(
        CASE
          WHEN r.winner IS NULL THEN 0
          WHEN r.winner IN ('nr', 'draw') THEN 1
          WHEN v.prediction = r.winner THEN 2
          ELSE 0
        END
      ), 0)::int AS points,
      COALESCE(SUM(
        CASE WHEN r.winner IS NOT NULL AND r.winner NOT IN ('nr', 'draw') AND v.prediction = r.winner THEN 1 ELSE 0 END
      ), 0)::int AS correct,
      COALESCE(COUNT(r.match_id), 0)::int AS voted,
      (SELECT COUNT(*)::int FROM results) AS matches
    FROM users u
    LEFT JOIN votes v ON v.user_id = u.id
    LEFT JOIN results r ON r.match_id = v.match_id
    WHERE NOT u.is_admin
    GROUP BY u.id, u.username, u.profile_pic
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
      u.profile_pic,
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
      COALESCE(COUNT(r.match_id), 0)::int AS voted,
      (SELECT COUNT(*)::int FROM results) AS matches
    FROM users u
    JOIN room_members rm ON rm.user_id = u.id AND rm.room_id = $1
    LEFT JOIN votes v ON v.user_id = u.id
    LEFT JOIN results r ON r.match_id = v.match_id
    WHERE NOT u.is_admin
    GROUP BY u.id, u.username, u.profile_pic
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

// ─── Automated Result Service (Cricbuzz API) ───────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "cricbuzz-cricket.p.rapidapi.com";

const TEAM_NAME_MAP = {
  "Chennai Super Kings": "CSK",
  "Mumbai Indians": "MI",
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Kolkata Knight Riders": "KKR",
  "Delhi Capitals": "DC",
  "Punjab Kings": "PBKS",
  "Rajasthan Royals": "RR",
  "Sunrisers Hyderabad": "SRH",
  "Gujarat Titans": "GT",
  "Lucknow Super Giants": "LSG",
};

/**
 * Normalizes team names for fuzzy matching
 */
function normalizeTeam(name) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Finds the Cricbuzz winner from the API response status string
 * Example: "RCB won by 20 runs" -> "RCB"
 */
function parseWinnerFromStatus(status, team1Code, team2Code) {
  if (!status) return null;
  const s = status.toLowerCase();
  
  // Direct match code check
  if (s.includes(team1Code.toLowerCase())) return team1Code;
  if (s.includes(team2Code.toLowerCase())) return team2Code;
  
  // Full name check
  for (const [fullName, code] of Object.entries(TEAM_NAME_MAP)) {
    if (s.includes(fullName.toLowerCase())) return code;
  }
  
  if (s.includes("draw") || s.includes("tied") || s.includes("no result") || s.includes("abandoned")) {
    return "nr";
  }
  
  return null;
}

async function checkRecentMatches(isManual = false) {
  if (!RAPIDAPI_KEY) {
    const msg = "⚠️  AutomatedResultService: RAPIDAPI_KEY missing. Skipping auto-check.";
    console.log(msg);
    return isManual ? { error: "API key missing" } : null;
  }

  try {
    // 1. Find matches that started > 4 hours ago and have no results
    const now = new Date();
    const pendingMatches = IPL_SCHEDULE.filter(m => {
      const startTime = new Date(`${m.date}T${m.time}:00+05:30`);
      // For manual check, we can be more lenient, maybe check any match from today or earlier
      const checkThreshold = isManual ? startTime : new Date(startTime.getTime() + 4 * 60 * 60 * 1000);
      return now >= checkThreshold;
    });

    if (pendingMatches.length === 0) return { updated: 0, checked: 0 };

    // Get existing results to avoid duplicate work
    const existingResults = await query("SELECT match_id FROM results");
    const existingIds = new Set(existingResults.map(r => r.match_id));
    
    const toCheck = pendingMatches.filter(m => !existingIds.has(m.id));
    if (toCheck.length === 0) return { updated: 0, checked: 0 };

    console.log(`🔍 AutomatedResultService: Checking ${toCheck.length} pending matches...`);
    let updatedCount = 0;

    // 2. Fetch recent matches from Cricbuzz
    const options = {
      method: 'GET',
      url: `https://${RAPIDAPI_HOST}/matches/list/recent`,
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const apiMatches = response.data.typeMatches?.find(tm => tm.matchType === "League")?.seriesMatches || [];
    
    // Flatten the matches list
    const allMatches = [];
    apiMatches.forEach(series => {
      if (series.seriesAdWrappers?.matches) {
        allMatches.push(...series.seriesAdWrappers.matches);
      }
    });

    for (const match of toCheck) {
      // Find matching API entry by date and teams
      const matchDateStr = match.date; // "2026-03-28"
      
      const apiMatch = allMatches.find(am => {
        const amDate = new Date(parseInt(am.matchInfo.startDate)).toISOString().split('T')[0];
        const t1 = am.matchInfo.team1.teamName;
        const t2 = am.matchInfo.team2.teamName;
        
        const teamsMatch = 
          (TEAM_NAME_MAP[t1] === match.team1 && TEAM_NAME_MAP[t2] === match.team2) ||
          (TEAM_NAME_MAP[t1] === match.team2 && TEAM_NAME_MAP[t2] === match.team1);
          
        return amDate === matchDateStr && teamsMatch;
      });

      if (!apiMatch) {
        console.log(`❓ AutomatedResultService: Could not find match ${match.id} (${match.team1} vs ${match.team2}) on Cricbuzz list.`);
        continue;
      }

      const status = apiMatch.matchInfo.status;
      const state = apiMatch.matchInfo.state;

      if (state === "Complete" || state === "Result" || status.includes("won by") || status.includes("Match abandoned")) {
        const winner = parseWinnerFromStatus(status, match.team1, match.team2);
        
        if (winner) {
          console.log(`🏆 AutomatedResultService: AUTO-DECLARING WINNER for ${match.id}: ${winner}`);
          await query(
            `INSERT INTO results (match_id, winner)
             VALUES ($1, $2)
             ON CONFLICT (match_id)
             DO UPDATE SET winner = EXCLUDED.winner`,
            [match.id, winner]
          );
          updatedCount++;
        }
      } else {
        console.log(`⏳ AutomatedResultService: Match ${match.id} still in progress (Status: ${status}).`);
      }
    }

    return { updated: updatedCount, checked: toCheck.length };

  } catch (error) {
    console.error("❌ AutomatedResultService Error:", error.message);
    return isManual ? { error: error.message } : null;
  }
}

// Start the check loop (every 25 minutes)
const CHECK_INTERVAL = 25 * 60 * 1000;
setInterval(checkRecentMatches, CHECK_INTERVAL);

// Initial check on startup
setTimeout(checkRecentMatches, 5000); // 5 sec delay to let DB init completion

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
