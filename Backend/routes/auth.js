require('dotenv').config();
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/user");

const SECRET = process.env.JWT_SECRET || "supersecret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// POST /api/auth/login  { username, role, adminPassword? }
router.post("/login", (req, res) => {
  const { username, role, adminPassword } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: "Username and role required" });
  }

  const validRoles = ["viewer", "admin"]; // editor role removed
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // Admin requires correct password
  if (role === "admin") {
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: "Invalid admin password" });
    }
  }

  const user = User.addUser(username, role);
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1h" });

  res.json({ token, user });
});

module.exports = router;