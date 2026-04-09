import { useState } from "react";

const TOOLS = [
  {
    id: "pen",
    label: "Pen",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    id: "eraser",
    label: "Eraser",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M6 18L17.5 6.5M6 6l12 12" />
      </svg>
    ),
  },
  {
    id: "rect",
    label: "Rectangle",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="1" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "circle",
    label: "Circle",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: "line",
    label: "Line",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <line x1="4" y1="20" x2="20" y2="4" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    icon: <span className="text-sm font-bold leading-none">T</span>,
  },
];

const COLORS = [
  "#ffffff", // white
  "#f87171", // red
  "#fb923c", // orange
  "#fbbf24", // yellow
  "#34d399", // green
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#000000", // black
];

export default function ToolBar({
  tool,
  setTool,
  color,
  setColor,
  strokeSize,
  setStrokeSize,
  onUndo,
  onRedo,
  onExportPNG,
  onExportPDF,
  onClearBoard,
  isAdmin,
}) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50
                    flex items-center gap-1.5 flex-wrap justify-center
                    bg-zinc-900 border border-zinc-700/80 rounded-2xl
                    px-3 py-2 shadow-2xl shadow-black/50 select-none">

      {/* Tool buttons */}
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setTool(t.id)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150
            ${tool === t.id
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
        >
          {t.icon}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-5 bg-zinc-700 mx-0.5" />

      {/* Color swatches */}
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => setColor(c)}
            className="rounded-full transition-transform duration-150 flex-shrink-0"
            style={{
              background: c,
              width: color === c ? 18 : 14,
              height: color === c ? 18 : 14,
              outline: color === c ? "2px solid white" : "1px solid rgba(255,255,255,0.15)",
              outlineOffset: color === c ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-zinc-700 mx-0.5" />

      {/* Stroke size */}
      <div className="flex items-center gap-2 px-1">
        <div
          className="rounded-full bg-white flex-shrink-0"
          style={{ width: strokeSize, height: strokeSize, maxWidth: 20, maxHeight: 20 }}
        />
        <input
          type="range"
          min={1}
          max={24}
          value={strokeSize}
          onChange={(e) => setStrokeSize(Number(e.target.value))}
          className="w-20 accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-zinc-700 mx-0.5" />

      {/* Undo */}
      <button
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        className="w-8 h-8 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4" />
        </svg>
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        title="Redo (Ctrl+Y)"
        className="w-8 h-8 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 10H11a5 5 0 00-5 5v1M21 10l-4-4M21 10l-4 4" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-zinc-700 mx-0.5" />

      {/* Export dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExport((v) => !v)}
          title="Export"
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
            ${showExport ? "bg-zinc-700 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4M8 8l4 4 4-4" />
          </svg>
        </button>

        {showExport && (
          <div className="absolute bottom-11 right-0 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden text-sm text-zinc-300 shadow-2xl shadow-black/60 min-w-[130px]">
            <button
              onClick={() => { onExportPNG(); setShowExport(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-zinc-800 text-left transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 4 4 4-8 4 8" />
              </svg>
              Export PNG
            </button>
            <div className="h-px bg-zinc-800" />
            <button
              onClick={() => { onExportPDF(); setShowExport(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-zinc-800 text-left transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Admin: clear board */}
      {isAdmin && (
        <>
          <div className="w-px h-5 bg-zinc-700 mx-0.5" />
          <button
            onClick={onClearBoard}
            title="Clear board (admin only)"
            className="w-8 h-8 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}