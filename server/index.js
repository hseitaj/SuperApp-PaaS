require("dotenv").config();
const express = require("express");
const http = require("http");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./db");

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const upload = multer({ dest: UPLOADS_DIR });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

// Sign‑up
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username & password required" });
  }
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.run(
    "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
    [id, username, hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Username taken" });
      res.json({ id, username });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username & password required" });
  }
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (!row) return res.status(400).json({ error: "Invalid credentials" });
      const valid = await bcrypt.compare(password, row.password);
      if (!valid) return res.status(400).json({ error: "Invalid credentials" });
      res.json({ id: row.id, username: row.username });
    }
  );
});

// List users (for ChatList)
app.get("/users", (req, res) => {
  db.all("SELECT id, username FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(rows);
  });
});

// Fetch message history for a room
app.get("/messages/:roomId", (req, res) => {
  const { roomId } = req.params;
  db.all(
    "SELECT sender, content, type FROM messages WHERE room = ? ORDER BY ROWID",
    [roomId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    }
  );
});

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File required" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ url });
});

// Socket.io
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join", (roomId) => {
    socket.join(roomId);
  });

  socket.on("message", ({ sender, receiver, content, type }) => {
    const room = [sender, receiver].sort().join("_");
    const msgId = uuidv4();
    db.run(
      "INSERT INTO messages (id, sender, receiver, content, type, room) VALUES (?, ?, ?, ?, ?, ?)",
      [msgId, sender, receiver, content, type, room]
    );
    io.to(room).emit("message", { sender, content, type });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
