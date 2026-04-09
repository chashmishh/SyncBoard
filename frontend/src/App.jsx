import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import { AuthProvider } from "./Context/AuthContext";
import CanvasBoard from "./components/CanvasBoard";
import ToolBar from "./components/ToolBar";
import UserList from "./components/UserList";
import LoginForm from "./components/LoginForm";
import CursorOverlay from "./components/CursorOverlay";

const socket = io("http://localhost:5000");

// ── Keyboard shortcut hook ────────────────────────────────────────────────────
function useKeyboardShortcuts(onUndo, onRedo) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUndo, onRedo]);
}

// ── Deterministic cursor color per username ───────────────────────────────────
const CURSOR_COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b",
  "#22c55e", "#ef4444", "#8b5cf6", "#0ea5e9",
];
function getCursorColor(username = "") {
  let hash = 0;
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});

  // Toolbar state
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ffffff");
  const [strokeSize, setStrokeSize] = useState(4);

  // Canvas action refs
  const undoRef = useRef(null);
  const redoRef = useRef(null);
  const exportPNGRef = useRef(null);
  const exportPDFRef = useRef(null);
  const clearBoardRef = useRef(null);

  const handleUndo = useCallback(() => undoRef.current?.(), []);
  const handleRedo = useCallback(() => redoRef.current?.(), []);

  useKeyboardShortcuts(handleUndo, handleRedo);

  useEffect(() => {
    socket.on("userList", (userList) => setUsers(userList));

    socket.on("cursor-update", ({ userId, x, y, name, color: cursorColor }) => {
      setCursors((prev) => ({ ...prev, [userId]: { x, y, name, color: cursorColor } }));
    });

    socket.on("userLeft", ({ userId }) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off("userList");
      socket.off("cursor-update");
      socket.off("userLeft");
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    socket.emit("userJoined", {
      ...userData,
      color: getCursorColor(userData.username),
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCursors({});
    setUsers([]);
    socket.disconnect();
    socket.connect();
  };

  if (!isLoggedIn) {
    return (
      <AuthProvider>
        <LoginForm onLogin={handleLogin} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-5 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Collaborative Whiteboard</h1>
              <p className="text-xs text-zinc-500">
                Room: <span className="font-mono text-zinc-400 tracking-wider">{user?.roomCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy room code button */}
            <button
              onClick={() => navigator.clipboard?.writeText(user?.roomCode || "")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs transition-colors font-mono tracking-wider"
              title="Copy room code"
            >
              {user?.roomCode}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* User badge */}
            <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-1.5 text-sm">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: getCursorColor(user?.username) }}
              />
              <span className="text-zinc-300 font-medium">{user?.username}</span>
              <span className="px-1.5 py-0.5 bg-zinc-700 rounded-lg text-xs text-zinc-400 capitalize">
                {user?.role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 rounded-xl text-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave
            </button>
          </div>
        </header>

        {/* ── Main area ── */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <CanvasBoard
              socket={socket}
              tool={tool}
              color={color}
              strokeSize={strokeSize}
              onUndo={undoRef}
              onRedo={redoRef}
              onExportPNG={exportPNGRef}
              onExportPDF={exportPDFRef}
              onClearBoard={clearBoardRef}
              userName={user?.username}
              userColor={getCursorColor(user?.username)}
            />
            <CursorOverlay cursors={cursors} />
          </div>
          <UserList users={users} />
        </div>

        {/* ── Floating toolbar ── */}
        <ToolBar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          strokeSize={strokeSize}
          setStrokeSize={setStrokeSize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportPNG={() => exportPNGRef.current?.()}
          onExportPDF={() => exportPDFRef.current?.()}
          onClearBoard={() => clearBoardRef.current?.()}
          isAdmin={user?.role === "admin"}
        />
      </div>
    </AuthProvider>
  );
}

export default App;