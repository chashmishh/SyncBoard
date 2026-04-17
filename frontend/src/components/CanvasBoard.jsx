import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import { AuthContext } from "../Context/AuthContext";
import { eraseLine } from "../utils/erase";

// ── Undo/redo history ────────────────────────────────────────────────────────
function useHistory(canvasRef) {
  const stack = useRef([]);
  const pointer = useRef(-1);

  const push = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL();
    stack.current = stack.current.slice(0, pointer.current + 1);
    stack.current.push(snap);
    pointer.current = stack.current.length - 1;
  }, [canvasRef]);

  const undo = useCallback(() => {
    if (pointer.current <= 0) return;
    pointer.current -= 1;
    const img = new Image();
    img.src = stack.current[pointer.current];
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
  }, [canvasRef]);

  const redo = useCallback(() => {
    if (pointer.current >= stack.current.length - 1) return;
    pointer.current += 1;
    const img = new Image();
    img.src = stack.current[pointer.current];
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
  }, [canvasRef]);

  const clear = useCallback(() => {
    stack.current = [];
    pointer.current = -1;
  }, []);

  return { push, undo, redo, clear };
}

// ── Export helpers ───────────────────────────────────────────────────────────
function exportPNG(canvas) {
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function exportPDF(canvas) {
  // Dynamically import jspdf so the rest of the app loads even if it's missing
  try {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("whiteboard.pdf");
  } catch {
    alert("PDF export requires jspdf. Run: npm install jspdf");
  }
}

// ── Shape drawing helpers ────────────────────────────────────────────────────
function drawShape(ctx, tool, start, end, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "rect") {
    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (tool === "circle") {
    const rx = (end.x - start.x) / 2;
    const ry = (end.y - start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(start.x + rx, start.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
  } else if (tool === "line") {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();
  }
}

// ── Main component ───────────────────────────────────────────────────────────
function CanvasBoard({ socket, tool, color, strokeSize, onUndo, onRedo, onExportPNG, onExportPDF, onClearBoard, userName, userColor }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null); // scratch canvas for shape preview
  const ctxRef = useRef(null);
  const { user } = useContext(AuthContext);

  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [shapeStart, setShapeStart] = useState(null);
  const [textInput, setTextInput] = useState(null); // { x, y }

  const { push, undo, redo, clear } = useHistory(canvasRef);

  const SHAPE_TOOLS = ["rect", "circle", "line"];

  // ── Canvas init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      // Save content before resize
      const tempImg = canvas.toDataURL();
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#18181b"; // zinc-900 dark canvas bg
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;

      // Restore content
      const img = new Image();
      img.src = tempImg;
      img.onload = () => ctx.drawImage(img, 0, 0);

      // Sync overlay canvas size
      if (overlayRef.current) {
        overlayRef.current.width = canvas.width;
        overlayRef.current.height = canvas.height;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Expose undo/redo/export/clear to parent via callbacks ──────────────────
  useEffect(() => { if (onUndo) onUndo.current = undo; }, [undo, onUndo]);
  useEffect(() => { if (onRedo) onRedo.current = redo; }, [redo, onRedo]);
  useEffect(() => {
    if (onExportPNG) onExportPNG.current = () => exportPNG(canvasRef.current);
  }, [onExportPNG]);
  useEffect(() => {
    if (onExportPDF) onExportPDF.current = () => exportPDF(canvasRef.current);
  }, [onExportPDF]);
  useEffect(() => {
    if (onClearBoard) onClearBoard.current = () => {
      if (user?.role !== "admin") return;
      socket.emit("clearBoard");
      clearCanvas();
      clear();
    };
  }, [onClearBoard, user, socket, clear]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const receiveDraw = (data) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      if (data.tool === "eraser") {
        eraseLine(ctx, data.x0, data.y0, data.x1, data.y1, data.size);
      } else if (SHAPE_TOOLS.includes(data.tool)) {
        drawShape(ctx, data.tool, { x: data.x0, y: data.y0 }, { x: data.x1, y: data.y1 }, data.color, data.size);
      } else if (data.tool === "text") {
        ctx.font = `${data.size * 4 + 12}px sans-serif`;
        ctx.fillStyle = data.color;
        ctx.fillText(data.text, data.x0, data.y0);
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = data.color || "#18181b";
        ctx.lineWidth = data.size || 2;
        ctx.beginPath();
        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.stroke();
        ctx.closePath();
      }
    };

    const handleClearBoard = () => clearCanvas();

    socket.on("draw", receiveDraw);
    socket.on("clearBoard", handleClearBoard);
    return () => {
      socket.off("draw", receiveDraw);
      socket.off("clearBoard", handleClearBoard);
    };
  }, [socket]);

  // ── Mouse cursor emit ──────────────────────────────────────────────────────
  const lastEmit = useRef(0);
  const getPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Support both mouse and touch by converting to canvas-local coordinates.
    if (e.touches?.length) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    if (typeof e.nativeEvent?.offsetX === "number" && typeof e.nativeEvent?.offsetY === "number") {
      return {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      };
    }

    return null;
  }, []);

  const emitCursor = useCallback((e) => {
    const now = Date.now();
    if (now - lastEmit.current < 32) return;
    lastEmit.current = now;
    const point = getPoint(e);
    if (!point) return;
    socket.emit("cursor-move", {
      x: point.x,
      y: point.y,
      name: userName,
      color: userColor,
    });
  }, [socket, getPoint, userName, userColor]);

  // ── Drawing ────────────────────────────────────────────────────────────────
  const startDrawing = (e) => {
    if (user?.role === "viewer") return;
    const point = getPoint(e);
    if (!point) return;
    const { x, y } = point;

    if (tool === "text") {
      setTextInput({ x, y });
      return;
    }

    setDrawing(true);
    setLastPos({ x, y });
    setShapeStart({ x, y });

    if (!SHAPE_TOOLS.includes(tool)) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
    }
  };

  const draw = (e) => {
    emitCursor(e);
    if (!drawing || user?.role === "viewer") return;
    const point = getPoint(e);
    if (!point) return;
    const { x, y } = point;
    const ctx = ctxRef.current;
    if (!ctx || !lastPos) return;

    if (SHAPE_TOOLS.includes(tool)) {
      // Preview shape on overlay canvas
      const oc = overlayRef.current?.getContext("2d");
      if (oc) {
        oc.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
        drawShape(oc, tool, shapeStart, { x, y }, color, strokeSize);
      }
      return;
    }

    if (tool === "eraser") {
      eraseLine(ctx, lastPos.x, lastPos.y, x, y, strokeSize);
      socket.emit("draw", { x0: lastPos.x, y0: lastPos.y, x1: x, y1: y, tool: "eraser", color, size: strokeSize });
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeSize;
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
      socket.emit("draw", { x0: lastPos.x, y0: lastPos.y, x1: x, y1: y, tool, color, size: strokeSize });
    }

    setLastPos({ x, y });
  };

  const stopDrawing = (e) => {
    if (!drawing) return;
    setDrawing(false);
    ctxRef.current?.closePath();

    const point = getPoint(e) || lastPos;
    if (SHAPE_TOOLS.includes(tool) && shapeStart && point) {
      drawShape(ctxRef.current, tool, shapeStart, { x: point.x, y: point.y }, color, strokeSize);
      socket.emit("draw", { x0: shapeStart.x, y0: shapeStart.y, x1: point.x, y1: point.y, tool, color, size: strokeSize });

      // Clear overlay
      const oc = overlayRef.current?.getContext("2d");
      if (oc) oc.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    push(); // snapshot for undo
    setLastPos(null);
    setShapeStart(null);
  };

  // ── Text input submit ──────────────────────────────────────────────────────
  const submitText = (value) => {
    if (!value.trim() || !textInput) return;
    const ctx = ctxRef.current;
    const fontSize = strokeSize * 4 + 12;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(value, textInput.x, textInput.y);
    socket.emit("draw", { x0: textInput.x, y0: textInput.y, tool: "text", text: value, color, size: strokeSize });
    setTextInput(null);
    push();
  };

  // ── Clear helper ───────────────────────────────────────────────────────────
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const cursorStyle = {
    pen: "crosshair",
    eraser: "cell",
    rect: "crosshair",
    circle: "crosshair",
    line: "crosshair",
    text: "text",
  }[tool] || "crosshair";

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden">
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          e.preventDefault();
          startDrawing(e);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          draw(e);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopDrawing(e);
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          stopDrawing(e);
        }}
      />

      {/* Shape preview overlay (transparent, pointer-events blocked) */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.85 }}
      />

      {/* Live status badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded-full px-3 py-1.5 text-xs text-zinc-400 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </div>

      {/* Viewer badge */}
      {user?.role === "viewer" && (
        <div className="absolute top-4 left-4 bg-zinc-900/80 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-400 backdrop-blur-sm">
          View only
        </div>
      )}

      {/* Floating text input when text tool is active */}
      {textInput && (
        <input
          autoFocus
          type="text"
          className="absolute bg-transparent border-none outline-none text-white caret-white"
          style={{
            left: textInput.x,
            top: textInput.y - strokeSize * 2 - 12,
            fontSize: `${strokeSize * 4 + 12}px`,
            color,
            minWidth: 120,
          }}
          onBlur={(e) => submitText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitText(e.target.value);
            if (e.key === "Escape") setTextInput(null);
          }}
        />
      )}
    </div>
  );
}

export default CanvasBoard;