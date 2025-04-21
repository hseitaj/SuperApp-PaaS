const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// Delete old DB so schema updates apply (for local dev only)
if (fs.existsSync("./db.sqlite")) fs.unlinkSync("./db.sqlite");

const db = new sqlite3.Database("./db.sqlite");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS blocks (
    blocker TEXT,
    blocked TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender TEXT,
    receiver TEXT,
    content TEXT,
    type TEXT DEFAULT 'text',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- one‑time migration: add "seen" column if it isn't there yet ---
db.get("PRAGMA table_info(messages)", (_, infoRows) => {
  const hasSeen = Array.isArray(infoRows)
    ? infoRows.some((r) => r.name === "seen")
    : false;

  if (!hasSeen) {
    db.run("ALTER TABLE messages ADD COLUMN seen INTEGER DEFAULT 0");
    console.log('⏫  Added "seen" column to messages table');
  }
});

module.exports = db;
