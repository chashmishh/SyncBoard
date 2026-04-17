export function eraseLine(ctx, x0, y0, x1, y1, size = 16, backgroundColor = "#18181b") {
  if (!ctx) return;

  // Draw with board background color to avoid transparent "black" artifacts.
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = backgroundColor;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.closePath();
}
