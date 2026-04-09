export default function CursorOverlay({ cursors }) {
  if (!cursors || typeof cursors !== "object") return null;

  // Only render cursors for admin users
  const adminEntries = Object.entries(cursors).filter(
    ([, cursor]) => cursor?.role === "admin"
  );

  if (adminEntries.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%", zIndex: 10 }}
    >
      {adminEntries.map(([id, cursor]) => {
        const { x, y, name = "?", color = "#f59e0b" } = cursor;
        if (typeof x !== "number" || typeof y !== "number") return null;
        const safeName = String(name);
        const labelWidth = safeName.length * 7 + 16;

        return (
          <g key={id} transform={`translate(${x},${y})`}>
            {/* Crown indicator above cursor for admins */}
            <text
              x="4" y="-4"
              style={{ fontSize: 10, fill: color, fontFamily: "inherit" }}
            >
              ★
            </text>
            {/* Cursor arrow */}
            <path
              d="M0 0 L0 14 L4 10 L7 16 L9 15 L6 9 L11 9 Z"
              fill={color}
              stroke="white"
              strokeWidth="0.8"
            />
            {/* Name label */}
            <rect x="12" y="10" width={labelWidth} height="18" rx="4" fill={color} />
            <text
              x="20" y="23"
              style={{ fontSize: 11, fill: "#fff", fontFamily: "inherit" }}
            >
              {safeName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}