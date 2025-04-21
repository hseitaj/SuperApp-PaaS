/* superapp‑paas/server/index.js */
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

/* ───────────────────── health check ───────────────────── */
app.get("/", (_, res) => res.send("OK"));

/* ───────────────────── uploads static ─────────────────── */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads"),
  filename: (_, f, cb) => cb(null, Date.now() + path.extname(f.originalname)),
});
const upload = multer({ storage });

/* ───────────────────── auth APIs ──────────────────────── */
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.run(
    "INSERT INTO users (id, username, password) VALUES (?,?,?)",
    [id, username, hash],
    (err) =>
      err
        ? res.status(400).json({ error: "Username taken" })
        : res.json({ id, username })
  );
});

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
      if (!(await bcrypt.compare(password, row.password)))
        return res.status(400).json({ error: "Invalid credentials" });
      res.json({ id: row.id, username: row.username });
    }
  );
});

/* ───────────────────── contacts list (all users) ─────── */
app.get("/rooms/:userId", (req, res) => {
  const { userId } = req.params;
  db.all(
    "SELECT id, username AS name FROM users WHERE id <> ?",
    [userId],
    (err, rows) =>
      err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

/* ───────────────────── recent chats (new) ─────────────── */
/* returns: [{ id, name, lastMsg, ts }] ordered newest‑first */
app.get("/recent/:userId", (req, res) => {
  const { userId } = req.params;
  db.all(
    `
     SELECT  u.id,
             u.username AS name,
             m.content   AS lastMsg,
             MAX(m.timestamp) AS ts
       FROM  messages m
       JOIN  users    u ON (u.id = m.sender OR u.id = m.receiver)
       WHERE (m.sender = ? OR m.receiver = ?)
         AND u.id <> ?
       GROUP BY u.id
       ORDER BY ts DESC
    `,
    [userId, userId, userId],
    (err, rows) =>
      err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

/* ───────────────────── message history ───────────────── */
app.get("/messages/:roomId", (req, res) => {
  const { roomId } = req.params;
  db.all(
    `SELECT id, sender, receiver, content, type, timestamp
       FROM messages
      WHERE receiver = ? OR sender = ?
      ORDER BY timestamp ASC`,
    [roomId, roomId],
    (err, rows) =>
      err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

/* ───────────────────── file upload ───────────────────── */
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ url });
});

/* ───────────────────── socket.io ─────────────────────── */
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));

  socket.on("message", ({ sender, receiver, content, type }) => {
    const id = uuidv4();
    const ts = Math.floor(Date.now() / 1000); // unix seconds

    db.run(
      "INSERT INTO messages (id, sender, receiver, content, type, timestamp) VALUES (?,?,?,?,?,?)",
      [id, sender, receiver, content, type, ts]
    );

    io.to(receiver).emit("message", {
      id,
      sender,
      receiver,
      content,
      type,
      timestamp: ts,
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
