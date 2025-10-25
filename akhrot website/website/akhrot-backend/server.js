// server.js
// Simple Express mock API for Akhrot authentication, profile, and orders.
// For development / demo only. Replace in-memory storage with real DB in production.

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

/* ===== Config ===== */
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "akhrot_dev_secret"; // change in real deploy
const TOKEN_EXPIRES_IN = "6h";

/* ===== In-memory "DB" =====
   Replace these with persistent DB calls in production.
*/
let users = [
  // example user (password: "password123")
  // { id: 1, name: "Test User", email: "test@akhrot.local", passwordHash: "<hash>", phone: "", address: "" }
];

let orders = {
  // keyed by userId
  // 1: [{ id:'AK001', date:'2025-10-01', status:'Delivered', total:1200 }]
};

/* ===== Helpers ===== */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ===== Routes ===== */

/**
 * POST /auth/signup
 * body: { name, email, password }
 */
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });

    const lowerEmail = String(email).toLowerCase();
    if (users.find(u => u.email === lowerEmail)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = users.length ? users[users.length - 1].id + 1 : 1;

    const newUser = { id, name: name.trim(), email: lowerEmail, passwordHash, phone: "", address: "" };
    users.push(newUser);

    // seed empty orders array for that user
    orders[id] = orders[id] || [];

    return res.status(201).json({ message: "Account created" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /auth/login
 * body: { email, password }
 * returns: { token, user: { id, name, email } }
 */
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const lowerEmail = String(email).toLowerCase();
    const user = users.find(u => u.email === lowerEmail);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /profile
 * Headers: Authorization: Bearer <token>
 */
app.get("/profile", authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // return profile without passwordHash
  const profile = { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address };
  res.json(profile);
});

/**
 * PUT /profile
 * body: { name?, phone?, address? }
 * Headers: Authorization
 */
app.put("/profile", authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { name, phone, address } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (address !== undefined) user.address = String(address).trim();

  const profile = { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address };
  res.json({ message: "Profile updated", profile });
});

/**
 * GET /orders
 * Headers: Authorization
 */
app.get("/orders", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userOrders = orders[userId] || [];
  res.json(userOrders);
});

/* ===== Seed demo user & orders (optional) ===== */
(async function seed() {
  if (users.length === 0) {
    const pw = await bcrypt.hash("password123", 10);
    users.push({ id: 1, name: "Abdullah Baqari", email: "abdullah@example.com", passwordHash: pw, phone: "03001234567", address: "Skardu, Gilgit-Baltistan" });
    orders[1] = [
      { id: "AK001", date: "2025-10-05", status: "Delivered", total: 800 },
      { id: "AK002", date: "2025-10-12", status: "Pending", total: 1200 }
    ];
    console.log("Seeded demo user: abdullah@example.com / password123");
  }
})();

/* ===== Run server ===== */
app.listen(PORT, () => {
  console.log(`✅ Akhrot mock API running: http://localhost:${PORT}`);
  console.log("Endpoints: POST /auth/signup, POST /auth/login, GET/PUT /profile, GET /orders");
});
