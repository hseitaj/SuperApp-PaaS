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

app.get("/", (_, res) => res.send("OK"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- uploads ---------- */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads"),
  filename: (_, f, cb) => cb(null, Date.now() + path.extname(f.originalname)),
});
const upload = multer({ storage });
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ url });
});

/* ---------- auth ---------- */
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing" });
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.run(
    "INSERT INTO users(id,username,password) VALUES(?,?,?)",
    [id, username, hash],
    (err) =>
      err
        ? res.status(400).json({ error: "Username taken" })
        : res.json({ id, username })
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, row) => {
      if (err || !row) return res.status(400).json({ error: "Invalid" });
      if (!(await bcrypt.compare(password, row.password)))
        return res.status(400).json({ error: "Invalid" });
      res.json({ id: row.id, username: row.username });
    }
  );
});

/* ---------- rooms & search ---------- */
app.get("/rooms/:uid", (req, res) => {
  const { uid } = req.params;
  db.all(
    `SELECT u.id, u.username AS name,
            COALESCE((
                SELECT COUNT(*) FROM messages
                WHERE sender = u.id AND receiver = ? AND seen = 0
            ),0) AS unread,
            COALESCE((
                SELECT MAX(createdAt) FROM messages
                WHERE (sender=u.id AND receiver=?)
                   OR (sender=? AND receiver=u.id)
            ),0) AS lastTime
     FROM users u
     WHERE u.id != ?
     ORDER BY unread DESC, lastTime DESC`,
    [uid, uid, uid, uid],
    (err, rows) => (err ? res.status(500).json(err) : res.json(rows))
  );
});

app.get("/search", (req, res) => {
  const q = `%${(req.query.username || "").toLowerCase()}%`;
  db.all(
    "SELECT id,username FROM users WHERE LOWER(username) LIKE ? LIMIT 20",
    [q],
    (e, r) => (e ? res.status(500).json(e) : res.json(r))
  );
});

/* ---------- messages ---------- */
app.get("/messages/:roomId/:meId", (req, res) => {
  const { roomId, meId } = req.params;
  db.all(
    `SELECT * FROM messages
     WHERE (sender=? AND receiver=?)
        OR (sender=? AND receiver=?)
     ORDER BY createdAt`,
    [meId, roomId, roomId, meId],
    (e, rows) => (e ? res.status(500).json(e) : res.json(rows))
  );
});

const srv = http.createServer(app);
const io = socketIo(srv, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join", (uid) => socket.join(uid));

  socket.on("message", ({ sender, receiver, content, type }) => {
    const id = uuidv4();
    const createdAt = Date.now();
    db.run(
      "INSERT INTO messages(id,sender,receiver,content,type,createdAt,delivered,seen) VALUES(?,?,?,?,?,?,1,0)",
      [id, sender, receiver, content, type, createdAt],
      () => {
        io.to(receiver).emit("message", {
          id,
          sender,
          receiver,
          content,
          type,
          createdAt,
          delivered: 1,
          seen: 0,
        });
      }
    );
  });

  socket.on("seen", ({ viewer, partner }) => {
    db.run("UPDATE messages SET seen=1 WHERE sender=? AND receiver=?", [
      partner,
      viewer,
    ]);
  });
});

const PORT = process.env.PORT || 3000;
srv.listen(PORT, () => console.log("server " + PORT));
