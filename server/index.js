const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "ipl2026-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ipl2026";

// ─── Database ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, "ipl.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    prediction TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(match_id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS results (
    match_id TEXT PRIMARY KEY,
    winner TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed default admin ──────────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ipl2026.com";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_DEFAULT_PW = process.env.ADMIN_DEFAULT_PW || "admin123";

(async () => {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
  if (!existing) {
    const hash = await bcrypt.hash(ADMIN_DEFAULT_PW, 10);
    db.prepare("INSERT INTO users (email, username, password_hash, is_admin) VALUES (?, ?, ?, 1)")
      .run(ADMIN_EMAIL, ADMIN_USERNAME, hash);
    console.log(`✅ Default admin created: ${ADMIN_EMAIL} / ${ADMIN_DEFAULT_PW}`);
  }
})();

// ─── Middleware ───────────────────────────────────────────────────────────────
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

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required" });
    }
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: "Username must be 2-20 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)");
    const result = stmt.run(email.toLowerCase().trim(), username.trim(), hash);
    const token = jwt.sign({ id: result.lastInsertRowid, username: username.trim(), email: email.toLowerCase().trim(), is_admin: 0 }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: result.lastInsertRowid, username: username.trim(), email: email.toLowerCase().trim(), is_admin: false } });
  } catch (e) {
    if (e.message?.includes("UNIQUE")) {
      return res.status(400).json({ error: "Email or username already taken" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, is_admin: !!user.is_admin } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, email, username, is_admin FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ ...user, is_admin: !!user.is_admin });
});

// ─── Admin: make user admin ──────────────────────────────────────────────────
app.post("/api/admin/unlock", authMiddleware, (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: "Wrong admin password" });
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(req.user.id);
  const token = jwt.sign({ ...req.user, is_admin: 1 }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, message: "Admin access granted" });
});

// ─── Votes ───────────────────────────────────────────────────────────────────
app.get("/api/votes", (req, res) => {
  const rows = db.prepare(`
    SELECT v.match_id, u.username, v.prediction 
    FROM votes v JOIN users u ON v.user_id = u.id
  `).all();
  // Group by match_id: { matchId: { username: prediction } }
  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.match_id]) grouped[r.match_id] = {};
    grouped[r.match_id][r.username] = r.prediction;
  }
  res.json(grouped);
});

app.post("/api/vote", authMiddleware, (req, res) => {
  const { matchId, prediction } = req.body;
  if (!matchId || !prediction) return res.status(400).json({ error: "matchId and prediction required" });
  try {
    db.prepare(`
      INSERT INTO votes (match_id, user_id, prediction) VALUES (?, ?, ?)
      ON CONFLICT(match_id, user_id) DO UPDATE SET prediction = excluded.prediction
    `).run(matchId, req.user.id, prediction);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Vote failed" });
  }
});

// ─── Results ─────────────────────────────────────────────────────────────────
app.get("/api/results", (req, res) => {
  const rows = db.prepare("SELECT match_id, winner FROM results").all();
  const map = {};
  for (const r of rows) map[r.match_id] = r.winner;
  res.json(map);
});

app.post("/api/result", authMiddleware, adminMiddleware, (req, res) => {
  const { matchId, winner } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId required" });
  if (!winner) {
    db.prepare("DELETE FROM results WHERE match_id = ?").run(matchId);
  } else {
    db.prepare(`
      INSERT INTO results (match_id, winner) VALUES (?, ?)
      ON CONFLICT(match_id) DO UPDATE SET winner = excluded.winner
    `).run(matchId, winner);
  }
  res.json({ ok: true });
});

// ─── Leaderboard ─────────────────────────────────────────────────────────────
app.get("/api/leaderboard", (req, res) => {
  const users = db.prepare("SELECT id, username FROM users").all();
  const votes = db.prepare("SELECT match_id, user_id, prediction FROM votes").all();
  const resultRows = db.prepare("SELECT match_id, winner FROM results").all();
  const resultMap = {};
  for (const r of resultRows) resultMap[r.match_id] = r.winner;

  const board = users.map(u => {
    let points = 0, correct = 0, total = 0;
    const userVotes = votes.filter(v => v.user_id === u.id);
    for (const v of userVotes) {
      const result = resultMap[v.match_id];
      if (result) {
        total++;
        if (result === "nr" || result === "draw") {
          points += 2;
        } else if (v.prediction === result) {
          points += 2;
          correct++;
        }
      }
    }
    return { username: u.username, points, correct, total, voted: userVotes.length };
  });

  board.sort((a, b) => b.points - a.points || b.correct - a.correct);
  res.json(board);
});

// ─── Users list ──────────────────────────────────────────────────────────────
app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT id, username FROM users").all();
  res.json(users);
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏏 IPL Predictor API running on http://localhost:${PORT}`);
});
