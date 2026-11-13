import type { DrinkId } from "@/data/aglData";
import { fillStroke } from "./shapes";

export interface GlassState {
  /** 0..1 liquid level */
  fill: number;
  /** 0..1 how many ice cubes are in */
  ice: number;
  garnished: boolean;
  time: number;
  /** Absolute Y for the straw tip, e.g. at someone's mouth */
  strawTipY?: number;
}

/** Glass anchored at its bottom-center (x, y); ~16px tall */
export function drawBarGlass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  drink: DrinkId,
  s: GlassState,
): void {
  const H = 16;
  const topW = drink === "popice" ? 13 : 11;
  const botW = drink === "popice" ? 9 : 10;

  const cupPath = () => {
    ctx.beginPath();
    ctx.moveTo(x - topW / 2, y - H);
    ctx.lineTo(x + topW / 2, y - H);
    ctx.lineTo(x + botW / 2, y);
    ctx.lineTo(x - botW / 2, y);
    ctx.closePath();
  };

  ctx.save();
  ctx.lineJoin = "round";

  // Glass body
  cupPath();
  ctx.fillStyle = "rgba(226, 240, 255, 0.35)";
  ctx.fill();

  ctx.save();
  cupPath();
  ctx.clip();
  const liquidTop = y - H * s.fill;
  if (s.fill > 0.01) {
    const g = ctx.createLinearGradient(0, liquidTop, 0, y);
    if (drink === "sprite") {
      g.addColorStop(0, "#d9f99d");
      g.addColorStop(1, "#86efac");
    } else if (drink === "cola") {
      g.addColorStop(0, "#7c2d12");
      g.addColorStop(1, "#3b0d05");
    } else {
      g.addColorStop(0, "#c08457");
      g.addColorStop(1, "#7c4a2d");
    }
    ctx.fillStyle = g;
    ctx.fillRect(x - topW, liquidTop, topW * 2, y - liquidTop);

    if (drink === "cola") {
      // Foam head
      ctx.fillStyle = "#f5e1c8";
      ctx.fillRect(x - topW, liquidTop - 1, topW * 2, 2.4);
    }
    if (drink !== "popice") {
      // Rising fizz
      for (let i = 0; i < 4; i++) {
        const p = ((s.time * 0.0022 + i * 0.27) % 1 + 1) % 1;
        const by = y - 1 - p * (y - liquidTop - 2);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.arc(x - 3 + ((i * 7) % 7), by, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Ice cubes float near the surface
  const cubes = Math.round(s.ice * 3);
  for (let i = 0; i < cubes; i++) {
    const cy = (s.fill > 0.15 ? liquidTop + 1 : y - 4) + (i % 2) * 3;
    ctx.fillStyle = "rgba(240, 249, 255, 0.85)";
    ctx.fillRect(x - 4.5 + i * 3, cy, 3.4, 3.4);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x - 4.5 + i * 3, cy, 3.4, 3.4);
  }
  // Glass shine
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(x - topW / 2 + 1.5, y - H + 2, 1.6, H - 4);
  ctx.restore();

  cupPath();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.1;
  ctx.stroke();

  if (s.garnished) {
    if (drink === "popice") {
      // Meses on top + dome lid + fat straw
      ctx.fillStyle = "#3b1d0b";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(x - 5 + i * 1.8, y - H * s.fill + 0.5 + (i % 2), 1.4, 0.8);
      }
      ctx.beginPath();
      ctx.ellipse(x, y - H, topW / 2 + 0.5, 4.5, 0, Math.PI, 0);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 1, y - H - 3);
      ctx.lineTo(x + 2.5, s.strawTipY ?? y - H - 9);
      ctx.stroke();
    } else {
      // Straw
      ctx.strokeStyle = drink === "sprite" ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 1.5, y - 4);
      ctx.lineTo(x + (s.strawTipY === undefined ? 3.5 : 1), s.strawTipY ?? y - H - 7);
      ctx.stroke();
      if (drink === "sprite") {
        // Lemon wheel on the rim
        ctx.beginPath();
        ctx.arc(x - topW / 2 + 1, y - H + 1, 3.4, 0, Math.PI * 2);
        fillStroke(ctx, "#fde047", 0.8, "#a16207");
        ctx.beginPath();
        ctx.arc(x - topW / 2 + 1, y - H + 1, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fef9c3";
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/** Soda gun nozzle + stream, or chocolate stream from a pitcher */
export function drawPourStream(
  ctx: CanvasRenderingContext2D,
  x: number,
  fromY: number,
  toY: number,
  drink: DrinkId,
  time: number,
): void {
  const color = drink === "sprite" ? "rgba(190, 242, 100, 0.9)" : drink === "cola" ? "rgba(92, 30, 10, 0.95)" : "rgba(146, 90, 56, 0.95)";
  const wob = Math.sin(time * 0.03) * 0.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = drink === "popice" ? 3 : 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, fromY);
  ctx.quadraticCurveTo(x + wob, (fromY + toY) / 2, x, toY);
  ctx.stroke();
  // Splash droplets
  for (let i = 0; i < 3; i++) {
    const p = ((time * 0.006 + i / 3) % 1 + 1) % 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 3 * p, toY - p * 4, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSparkleStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}
