import React from "react";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    avatar: "bg-amber-500/20 text-amber-400",
    dot: "bg-amber-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    ),
    perm: "Full control + clear board",
  },

  viewer: {
    label: "Viewer",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    avatar: "bg-zinc-700 text-zinc-400",
    dot: "bg-zinc-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.9.3C6.2 8.1 8.9 6 12 6s5.8 2.1 6.9 6.3c-1.1 4.2-3.8 6.3-6.9 6.3s-5.8-2.1-6.9-6.3z" />
      </svg>
    ),
    perm: "Read-only access",
  },
};

function AvatarInitials({ username, role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer;
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${cfg.avatar}`}>
      {initials}
    </div>
  );
}

function UserList({ users }) {
  return (
    <div className="w-64 flex flex-col bg-zinc-900 border-l border-zinc-800 overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">Online</span>
          <span className="text-xs px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/25 rounded-full font-medium">
            {users.length} {users.length === 1 ? "user" : "users"}
          </span>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-0">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-600 gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-1a4 4 0 00-5.916-3.5M9 20H4v-1a4 4 0 015.916-3.5M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">No users connected</p>
          </div>
        ) : (
          users.map((user) => {
            const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.viewer;
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors duration-150"
              >
                <AvatarInitials username={user.username} role={user.role} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{user.username}</div>
                  <div className={`inline-flex items-center gap-1 mt-0.5 text-xs px-1.5 py-0.5 rounded-md border ${cfg.badge}`}>
                    {cfg.icon}
                    {cfg.label}
                  </div>
                </div>
                {/* Online dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              </div>
            );
          })
        )}
      </div>

      {/* Role legend */}
      <div className="border-t border-zinc-800 px-4 py-4 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Permissions</p>
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          <div key={role} className="flex items-start gap-2.5">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.avatar}`}>
              {cfg.icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-300">{cfg.label}</div>
              <div className="text-xs text-zinc-500">{cfg.perm}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default UserList;