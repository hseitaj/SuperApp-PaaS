/* server/index.js */
require("dotenv").config();
const express = require("express");
const http = require("http");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

/* health‑check */
app.get("/", (_, res) => res.send("OK"));

/* ---------- static uploads ---------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads"),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ---------- auth ---------- */
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const hash = await bcrypt.hash(password, 10);
  const id = uuid();

  db.run(
    "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
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
      const ok = await bcrypt.compare(password, row.password);
      ok
        ? res.json({ id: row.id, username: row.username })
        : res.status(400).json({ error: "Invalid credentials" });
    }
  );
});

/* ---------- contacts & search ---------- */
app.get("/rooms/:me", (req, res) => {
  db.all(
    "SELECT id, username AS name FROM users WHERE id != ?",
    [req.params.me],
    (err, rows) =>
      err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

app.get("/search", (req, res) => {
  const q = `%${(req.query.q || "").toLowerCase()}%`;
  db.all(
    "SELECT id, username FROM users WHERE LOWER(username) LIKE ? LIMIT 20",
    [q],
    (err, rows) =>
      err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

/* ---------- messages ---------- */
/* between two people irrespective of direction */
app.get("/messages/:me/:other", (req, res) => {
  const { me, other } = req.params;
  db.all(
    `SELECT * FROM messages
     WHERE (sender = ? AND receiver = ?)
        OR (sender = ? AND receiver = ?)
     ORDER BY timestamp ASC`,
    [me, other, other, me],
    (err, rows) =>
      err ? res.status(500).json({ error: err.message }) : res.json(rows)
  );
});

/* generic create (used by REST fallback) */
app.post("/messages", (req, res) => {
  const { sender, receiver, content, type, timestamp } = req.body;
  const id = uuid();
  db.run(
    "INSERT INTO messages (id, sender, receiver, content, type, timestamp) VALUES (?,?,?,?,?,?)",
    [
      id,
      sender,
      receiver,
      content,
      type,
      timestamp || Math.floor(Date.now() / 1000),
    ],
    (err) =>
      err ? res.status(500).json({ error: err.message }) : res.json({ id })
  );
});

/* ---------- uploads ---------- */
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({
    url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
  });
});

/* ---------- realtime ---------- */
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

io.on("connection", (sock) => {
  sock.on("join", (uid) => sock.join(uid));

  sock.on("message", (m) => {
    const id = uuid();
    const ts = Math.floor(Date.now() / 1000);
    const row = { ...m, id, timestamp: ts };

    db.run(
      "INSERT INTO messages (id, sender, receiver, content, type, timestamp) VALUES (?,?,?,?,?,?)",
      [id, m.sender, m.receiver, m.content, m.type, ts]
    );

    io.to(m.receiver).emit("message", row);
    io.to(m.sender).emit("message", row); // echo so sender sees it instantly
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server on", PORT));
