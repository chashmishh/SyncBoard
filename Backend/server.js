require('dotenv').config();
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// ── Room state ────────────────────────────────────────────────────────────────
// rooms: Map<roomCode, Map<socketId, userData>>
const rooms = new Map();

function getRoomUsers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];
  return Array.from(room.values());
}

function broadcastRoomUsers(roomCode) {
  io.to(roomCode).emit("userList", getRoomUsers(roomCode));
}

// ── Socket connections ────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  let currentRoom = null;

  // User joins a room
  socket.on("userJoined", (userData) => {
    const roomCode = userData.roomCode;
    if (!roomCode) {
      console.warn("userJoined called without roomCode");
      return;
    }

    currentRoom = roomCode;

    // Create room if it doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, new Map());
      console.log(`Room created: ${roomCode}`);
    }

    // Add user to room
    rooms.get(roomCode).set(socket.id, {
      id: socket.id,
      username: userData.username,
      role: userData.role,
      roomCode,
    });

    // Join socket.io room
    socket.join(roomCode);
    console.log(`${userData.username} joined room ${roomCode}`);

    // Send updated user list to everyone in the room
    broadcastRoomUsers(roomCode);
  });

  // Drawing — broadcast only to the same room
  socket.on("draw", (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("draw", data);
  });

  // Cursor movement — broadcast to room peers
  socket.on("cursor-move", ({ x, y, name, color }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const user = room?.get(socket.id);
    if (!user) return;
    socket.to(currentRoom).emit("cursor-update", {
      userId: socket.id,
      x,
      y,
      name,
      color,
      role: user.role, // always use server-authoritative role, never trust client
    });
  });

  // Clear board — admin only enforced on frontend, double-checked here
  socket.on("clearBoard", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    const user = room?.get(socket.id);
    if (user?.role !== "admin") return;
    console.log(`Board cleared in room ${currentRoom} by ${user.username}`);
    io.to(currentRoom).emit("clearBoard");
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    if (!currentRoom) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const userData = room.get(socket.id);
    room.delete(socket.id);

    // Notify peers that cursor should be removed
    socket.to(currentRoom).emit("userLeft", { userId: socket.id });

    // Update user list for the room
    broadcastRoomUsers(currentRoom);

    if (userData) {
      console.log(`${userData.username} left room ${currentRoom}`);
    }

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(currentRoom);
      console.log(`Room ${currentRoom} deleted (empty)`);
    }
  });
});

// ── Health check endpoint ─────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const roomInfo = Array.from(rooms.entries()).map(([code, users]) => ({
    code,
    userCount: users.size,
  }));
  res.json({ status: "ok", rooms: roomInfo });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));