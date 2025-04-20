// superapp-paas/server/index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ★ health check for GET /
app.get("/", (req, res) => res.send("OK"));

// static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads"),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// SIGNUP
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
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

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err || !row)
        return res.status(400).json({ error: "Invalid credentials" });
      const valid = await bcrypt.compare(password, row.password);
      if (!valid) return res.status(400).json({ error: "Invalid credentials" });
      res.json({ id: row.id, username: row.username });
    }
  );
});

// ROOMS (fixes your 404)
app.get("/rooms/:userId", (req, res) => {
  const { userId } = req.params;
  db.all(
    "SELECT id, username AS name FROM users WHERE id != ?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// MESSAGE HISTORY
app.get("/messages/:roomId", (req, res) => {
  const { roomId } = req.params;
  db.all(
    `SELECT id, sender, receiver, content, type
     FROM messages
     WHERE receiver = ? OR sender = ?
     ORDER BY rowid ASC`,
    [roomId, roomId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// UPLOAD
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ url });
});

// SOCKET.IO
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));
  socket.on("message", ({ sender, receiver, content, type }) => {
    const id = uuidv4();
    db.run(
      "INSERT INTO messages (id, sender, receiver, content, type) VALUES (?, ?, ?, ?, ?)",
      [id, sender, receiver, content, type]
    );
    io.to(receiver).emit("message", { id, sender, receiver, content, type });
  });
});

// SEARCH users by username (case‑insensitive, simple LIKE)
app.get("/search", (req, res) => {
  const q = `%${(req.query.username || "").toLowerCase()}%`;
  db.all(
    "SELECT id, username FROM users WHERE LOWER(username) LIKE ? LIMIT 20",
    [q],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
