/** Cozy speech / hover bubble above characters */
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  text: string,
  time: number,
  opts?: { maxWidth?: number },
): void {
  const bob = Math.sin(time * 0.005) * 2;
  const y = screenY + bob;

  ctx.font = "600 12px Nunito, sans-serif";
  const paddingX = 10;
  const paddingY = 7;
  const metrics = ctx.measureText(text);
  const maxW = opts?.maxWidth ?? 160;
  const textW = Math.min(maxW, metrics.width);
  const w = textW + paddingX * 2;
  const h = 22 + paddingY;
  const x = screenX - w / 2;

  // Soft shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(screenX, y + 6, w * 0.35, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bubble body
  roundRect(ctx, x, y - h, w, h, 10);
  ctx.fillStyle = "#fffdf6";
  ctx.fill();
  ctx.strokeStyle = "#5b3a29";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(screenX - 6, y - 2);
  ctx.lineTo(screenX, y + 8);
  ctx.lineTo(screenX + 6, y - 2);
  ctx.closePath();
  ctx.fillStyle = "#fffdf6";
  ctx.fill();
  ctx.stroke();

  // Cover tail top stroke with fill strip
  ctx.fillStyle = "#fffdf6";
  ctx.fillRect(screenX - 7, y - 4, 14, 4);

  ctx.fillStyle = "#3b2a1a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, screenX, y - h / 2 - 1, maxW);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
