import React, { useState, useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { login } from "../services/api";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Step 1: Login ─────────────────────────────────────────────────────────────
function StepLogin({ onNext }) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("viewer");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError("Username is required"); return; }
    if (role === "admin" && !adminPassword.trim()) { setError("Admin password is required"); return; }
    setLoading(true);
    setError("");
    try {
      const response = await login(username, role, adminPassword);
      const userData = {
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        token: response.token,
      };
      setUser(userData);
      onNext(userData);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    {
      value: "viewer", label: "Viewer", desc: "Read only",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.9.3C6.2 8.1 8.9 6 12 6s5.8 2.1 6.9 6.3c-1.1 4.2-3.8 6.3-6.9 6.3s-5.8-2.1-6.9-6.3z" /></svg>,
    },
    {
      value: "admin", label: "Admin", desc: "Full control",
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/40">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Collaborative Whiteboard</h2>
        <p className="text-zinc-400 text-sm mt-1">Sign in to continue</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Username */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Username</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Role selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => { setRole(r.value); setError(""); setAdminPassword(""); }}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all duration-150
                ${role === r.value
                  ? r.value === "admin"
                    ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
                    : "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                }`}
            >
              {r.icon}
              <span className="font-medium text-xs">{r.label}</span>
              <span className="text-zinc-500 text-xs">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin password — only when admin selected */}
      {role === "admin" && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-amber-500/80 uppercase tracking-wider">
            Admin Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-amber-600/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-800 border border-amber-500/40 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-amber-600/60">Required to join as admin</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
        ) : (
          <>Continue <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
        )}
      </button>
    </form>
  );
}

// ── Step 2: Room code ─────────────────────────────────────────────────────────
function StepRoom({ userData, onJoin }) {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");

  const handleCreate = () => setCreated(generateRoomCode());

  const handleJoin = (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) { setError("Enter a valid room code"); return; }
    onJoin({ ...userData, roomCode: code });
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5.916-3.5M9 20H4v-2a4 4 0 015.916-3.5M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Join a Room</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Welcome, <span className="text-indigo-400 font-medium">{userData.username}</span>
          {userData.role === "admin" && (
            <span className="ml-2 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">Admin</span>
          )}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Create */}
      {!created && (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create a new room
          </div>
          <button onClick={handleCreate} className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium py-2.5 rounded-xl text-sm transition-colors">
            Generate room code
          </button>
        </div>
      )}

      {created && (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-zinc-500">Share this code with others:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-2xl font-bold tracking-[0.3em] text-center py-3 bg-zinc-900 border border-zinc-600 rounded-xl text-indigo-300">
              {created}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(created)}
              className="p-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors text-zinc-300"
              title="Copy"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => onJoin({ ...userData, roomCode: created })}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            Enter room
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {!created && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 font-medium">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
              </svg>
              Join existing room
            </div>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                maxLength={8}
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="ENTER CODE"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 text-sm font-mono tracking-widest uppercase text-center focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                Join room
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [step, setStep] = useState("login");
  const [userData, setUserData] = useState(null);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          {["login", "room"].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${step === s ? "bg-indigo-500" : step === "room" && i === 0 ? "bg-zinc-600" : "bg-zinc-800"}`} />
              {i === 0 && <div className={`h-px w-8 transition-colors duration-300 ${step === "room" ? "bg-zinc-600" : "bg-zinc-800"}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 shadow-2xl shadow-black/60">
          {step === "login"
            ? <StepLogin onNext={(data) => { setUserData(data); setStep("room"); }} />
            : <StepRoom userData={userData} onJoin={onLogin} />
          }
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">Real-time collaboration · Socket.IO</p>
      </div>
    </div>
  );
}

export default LoginForm;