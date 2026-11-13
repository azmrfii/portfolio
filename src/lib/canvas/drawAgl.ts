import {
  AGL_BACK_WALL_BOTTOM,
  AGL_WALLS,
  AGL_ZONES,
  BAR_BACK_TOP_Y,
  BAR_COUNTER_TOP_Y,
  BAR_STATIONS,
  getAglFurnitureRect,
  type AglFurnitureItem,
  type AglNpcData,
  type DrinkId,
} from "@/data/aglData";
import type { BaristaFrame } from "./barista";
import { drawCharacter } from "./drawCharacter";
import { drawBarGlass, drawPourStream, drawSparkleStar } from "./drawDrink";
import { drawSpeechBubble } from "./drawSpeechBubble";
import { OUTLINE, fillStroke, groundShadow, roundRectPath, shade } from "./shapes";
import type { Facing, WorldRenderContext } from "./types";

const NEON = ["#ec4899", "#8b5cf6", "#06b6d4", "#facc15", "#10b981"];
const WALL_TOP = 54;
const ROOM_L = 44;
const ROOM_R = 876;
const ROOM_B = 600;
const DISCO_BALL = { x: 460, y: 246 };

/** Visual height above each footprint (for highlights & hint placement) */
const RISE: Record<string, number> = {
  dj_speaker_left: 40,
  dj_speaker_right: 40,
  dj_booth: 20,
  bar_back: 24,
  bar_counter: 26,
  bar_stools: 12,
  lounge_sofa_left: 16,
  lounge_sofa_right: 16,
  lounge_table_left: 4,
  lounge_table_right: 4,
  photobox: 54,
  arcade_machine: 48,
};

export function aglFurnitureTopY(item: AglFurnitureItem): number {
  return getAglFurnitureRect(item).top - (RISE[item.id] ?? 0);
}

export interface CounterDrink {
  drink: DrinkId;
  x: number;
  empty: boolean;
}

export interface AglSceneState {
  barista?: BaristaFrame | null;
  order?: DrinkId | null;
  counterDrink?: CounterDrink | null;
}

function beatColor(time: number, offset = 0): string {
  return NEON[(Math.floor(time / 900) + offset) % NEON.length];
}

function ease(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

// ============================================================================
// Ground, floors & back wall
// ============================================================================

export function drawAglGround(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY, viewW, viewH, time } = w;
  ctx.fillStyle = "#07040d";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  ctx.lineJoin = "round";

  drawBaseFloor(ctx);
  drawBarFloor(ctx);
  drawLoungeCarpet(ctx, AGL_ZONES.loungeLeft);
  drawLoungeCarpet(ctx, AGL_ZONES.loungeRight);
  drawDanceFloor(ctx, time);
  drawEntrance(ctx);
  drawFloorSpecks(ctx, time);
  drawBackWall(ctx, time);
  drawWallCaps(ctx);

  ctx.restore();
}

function drawBaseFloor(ctx: CanvasRenderingContext2D): void {
  const top = AGL_BACK_WALL_BOTTOM;
  const S = 40;
  for (let y = top; y < ROOM_B; y += S) {
    for (let x = ROOM_L; x < ROOM_R; x += S) {
      const odd = ((x - ROOM_L) / S + (y - top) / S) % 2 === 1;
      ctx.fillStyle = odd ? "#1a1325" : "#15101e";
      ctx.fillRect(x, y, Math.min(S, ROOM_R - x), Math.min(S, ROOM_B - y));
    }
  }
  // Glossy reflection
  const g = ctx.createLinearGradient(0, top, 0, ROOM_B);
  g.addColorStop(0, "rgba(139, 92, 246, 0.10)");
  g.addColorStop(0.5, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(236, 72, 153, 0.06)");
  ctx.fillStyle = g;
  ctx.fillRect(ROOM_L, top, ROOM_R - ROOM_L, ROOM_B - top);
}

function drawBarFloor(ctx: CanvasRenderingContext2D): void {
  const z = AGL_ZONES.bar;
  const plank = 12;
  const tones = ["#3a2418", "#33201a", "#40291c"];
  for (let row = 0; row * plank < z.h; row++) {
    const y = z.y + row * plank;
    const h = Math.min(plank, z.y + z.h - y);
    ctx.fillStyle = tones[row % tones.length];
    ctx.fillRect(z.x, y, z.w, h);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(z.x, y + h - 1, z.w, 1);
    const off = (row * 23) % 64;
    for (let sx = z.x + off; sx < z.x + z.w; sx += 64) {
      ctx.fillRect(sx, y, 1, h);
    }
  }
  // Brass edge where the wood meets the club floor
  ctx.fillStyle = "#b08d57";
  ctx.fillRect(z.x, z.y + z.h, z.w, 2);
  ctx.fillRect(z.x - 2, z.y, 2, z.h + 2);
}

function drawLoungeCarpet(ctx: CanvasRenderingContext2D, z: { x: number; y: number; w: number; h: number }): void {
  roundRectPath(ctx, z.x, z.y, z.w, z.h, 10);
  fillStroke(ctx, "#2e1747", 2, "#140a22");
  ctx.save();
  roundRectPath(ctx, z.x, z.y, z.w, z.h, 10);
  ctx.clip();
  // Diamond pattern
  ctx.strokeStyle = "rgba(250, 204, 21, 0.08)";
  ctx.lineWidth = 1;
  for (let d = -z.h; d < z.w + z.h; d += 22) {
    ctx.beginPath();
    ctx.moveTo(z.x + d, z.y);
    ctx.lineTo(z.x + d + z.h, z.y + z.h);
    ctx.moveTo(z.x + d + z.h, z.y);
    ctx.lineTo(z.x + d, z.y + z.h);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
  ctx.setLineDash([5, 4]);
  roundRectPath(ctx, z.x + 7, z.y + 7, z.w - 14, z.h - 14, 7);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDanceFloor(ctx: CanvasRenderingContext2D, time: number): void {
  const z = AGL_ZONES.dance;
  const glow = beatColor(time);

  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;
  roundRectPath(ctx, z.x - 8, z.y - 8, z.w + 16, z.h + 16, 8);
  fillStroke(ctx, "#0d0a14", 2.5, glow);
  ctx.restore();
  roundRectPath(ctx, z.x - 4, z.y - 4, z.w + 8, z.h + 8, 5);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const cols = 5;
  const rows = 4;
  const tw = z.w / cols;
  const th = z.h / rows;
  const cc = (cols - 1) / 2;
  const cr = (rows - 1) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = z.x + c * tw;
      const ty = z.y + r * th;
      const dist = Math.hypot(c - cc, (r - cr) * 1.2);
      const wave = Math.max(0, Math.sin(time * 0.006 - dist * 1.4));
      const color = NEON[(Math.floor(time / 900) + r + c * 2) % NEON.length];
      ctx.fillStyle = "#1a1328";
      ctx.fillRect(tx + 1.5, ty + 1.5, tw - 3, th - 3);
      ctx.globalAlpha = 0.22 + wave * 0.55;
      ctx.fillStyle = color;
      ctx.fillRect(tx + 1.5, ty + 1.5, tw - 3, th - 3);
      ctx.globalAlpha = 1;
      // Glass sheen
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(tx + 3, ty + 3, tw - 6, 3);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 1.5, ty + 1.5, tw - 3, th - 3);
    }
  }
}

function drawEntrance(ctx: CanvasRenderingContext2D): void {
  // Red carpet from the door
  const L = 428;
  const R = 492;
  const T = 444;
  ctx.fillStyle = "#9f1239";
  ctx.fillRect(L, T, R - L, ROOM_B - T + 20);
  ctx.fillStyle = "#be123c";
  ctx.fillRect(L + 4, T, R - L - 8, ROOM_B - T + 20);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(L + 4, T, 1.5, ROOM_B - T + 20);
  ctx.fillRect(R - 5.5, T, 1.5, ROOM_B - T + 20);

  // Velvet rope stanchions
  for (const px of [416, 504]) {
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(px, 470);
    ctx.quadraticCurveTo(px + (px < 460 ? -5 : 5), 505, px, 540);
    ctx.stroke();
    for (const py of [476, 546]) {
      groundShadow(ctx, px, py, 5, 2, 0.35);
      ctx.fillStyle = "#a16207";
      ctx.fillRect(px - 1.5, py - 14, 3, 14);
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 2, 0, 0, Math.PI * 2);
      fillStroke(ctx, "#ca8a04", 1);
      ctx.beginPath();
      ctx.arc(px, py - 15, 2.8, 0, Math.PI * 2);
      fillStroke(ctx, "#fde047", 1);
    }
  }
}

function drawFloorSpecks(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ROOM_L, AGL_BACK_WALL_BOTTOM, ROOM_R - ROOM_L, ROOM_B - AGL_BACK_WALL_BOTTOM);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 34; i++) {
    const ang = i * 2.399 + time * 0.00035;
    const r = 40 + ((i * 53) % 320);
    const x = DISCO_BALL.x + Math.cos(ang) * r * 1.25;
    const y = 360 + Math.sin(ang) * r * 0.62;
    const tw = 0.5 + 0.5 * Math.sin(time * 0.01 + i);
    ctx.fillStyle = `rgba(255,255,255,${0.12 + tw * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackWall(ctx: CanvasRenderingContext2D, time: number): void {
  const B = AGL_BACK_WALL_BOTTOM;
  const g = ctx.createLinearGradient(0, WALL_TOP, 0, B);
  g.addColorStop(0, "#160d28");
  g.addColorStop(1, "#2a1946");
  ctx.fillStyle = g;
  ctx.fillRect(ROOM_L, WALL_TOP, ROOM_R - ROOM_L, B - WALL_TOP);
  // Acoustic panels
  for (let x = ROOM_L; x < ROOM_R; x += 26) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x, WALL_TOP, 1, B - WALL_TOP);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(x + 1, WALL_TOP, 1, B - WALL_TOP);
  }

  drawLedWall(ctx, time);
  drawNeonSign(ctx, time);
  drawBackBar(ctx, time);

  // Baseboard + cyan neon line
  ctx.fillStyle = "#0f0819";
  ctx.fillRect(ROOM_L, B - 6, ROOM_R - ROOM_L, 6);
  ctx.save();
  ctx.shadowColor = "#06b6d4";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(ROOM_L, B - 6, ROOM_R - ROOM_L, 1.5);
  ctx.restore();
}

function drawLedWall(ctx: CanvasRenderingContext2D, time: number): void {
  const L = 72;
  const R = 318;
  const T = 60;
  const B = 102;
  roundRectPath(ctx, L - 3, T - 3, R - L + 6, B - T + 6, 3);
  fillStroke(ctx, "#475569", 1.2, "#0f172a");
  ctx.fillStyle = "#05030a";
  ctx.fillRect(L, T, R - L, B - T);

  const n = 30;
  const bw = (R - L - 8) / n;
  for (let i = 0; i < n; i++) {
    const h =
      4 + Math.abs(Math.sin(time * 0.009 + i * 0.55) * Math.cos(time * 0.0033 + i * 0.21)) * (B - T - 16);
    const hue = (i * 11 + time * 0.05) % 360;
    ctx.fillStyle = `hsl(${hue} 90% 60%)`;
    for (let sy = B - 3; sy > B - 3 - h; sy -= 3) {
      ctx.fillRect(L + 4 + i * bw, sy - 2, bw - 1.5, 2);
    }
  }
  ctx.font = "800 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("♫  DJ VALDY • AGL BEATS  ♫", (L + R) / 2, T + 7);

  // Truss with spotlight cans
  ctx.fillStyle = "#64748b";
  ctx.fillRect(L - 6, WALL_TOP, R - L + 12, 3);
  for (let i = 0; i < 5; i++) {
    const cx = L + 14 + i * ((R - L - 28) / 4);
    ctx.beginPath();
    ctx.arc(cx, WALL_TOP + 3, 3.2, 0, Math.PI);
    fillStroke(ctx, "#1e293b", 1, "#0f172a");
    ctx.fillStyle = beatColor(time, i);
    ctx.fillRect(cx - 1.5, WALL_TOP + 4.5, 3, 1.4);
  }
}

function drawNeonSign(ctx: CanvasRenderingContext2D, time: number): void {
  const cx = 443;
  roundRectPath(ctx, 362, 60, 162, 42, 8);
  fillStroke(ctx, "#120a1f", 1.4, "#3b2361");
  const flicker = Math.sin(time * 0.013) > 0.97 ? 0.45 : 1;
  ctx.save();
  ctx.globalAlpha = flicker;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ec4899";
  ctx.shadowBlur = 14;
  ctx.font = "900 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#f9a8d4";
  ctx.fillText("AGL", cx, 77);
  ctx.shadowColor = "#06b6d4";
  ctx.font = "800 8.5px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#a5f3fc";
  ctx.fillText("DISCO  &  BAR", cx, 95);
  ctx.restore();
  ctx.fillStyle = "#facc15";
  ctx.font = "900 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★", cx - 52, 78);
  ctx.fillText("★", cx + 52, 78);
}

const BOTTLE_COLORS = ["#16a34a", "#b45309", "#7c3aed", "#0891b2", "#dc2626", "#ca8a04", "#db2777"];

function drawBottle(ctx: CanvasRenderingContext2D, x: number, bottom: number, h: number, color: string): void {
  roundRectPath(ctx, x - 3, bottom - h + 5, 6, h - 5, 1.6);
  fillStroke(ctx, color, 0.9, "#0f0a14");
  ctx.fillStyle = color;
  ctx.fillRect(x - 1.2, bottom - h, 2.4, 6);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillRect(x - 2.2, bottom - h * 0.45, 4.4, 3);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x - 2, bottom - h + 6, 1, h - 9);
}

function drawBackBar(ctx: CanvasRenderingContext2D, time: number): void {
  // Menu chalkboard
  roundRectPath(ctx, 566, 60, 66, 44, 3);
  fillStroke(ctx, "#1f2a24", 2.2, "#5b3a29");
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "800 7.5px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#fef3c7";
  ctx.fillText("MENU", 584, 68);
  ctx.font = "600 6.5px ui-sans-serif, system-ui, sans-serif";
  for (const [i, label, c] of [
    [0, "Sprite", "#4ade80"],
    [1, "Coca Cola", "#f87171"],
    [2, "Pop Ice", "#c08457"],
  ] as const) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(574, 79 + i * 9, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(label, 579, 79 + i * 9);
  }

  // Backlit bottle shelves
  const L = 640;
  const R = 868;
  const T = 58;
  const B = 106;
  const back = ctx.createLinearGradient(0, T, 0, B);
  back.addColorStop(0, "#7c2d12");
  back.addColorStop(0.5, "#f59e0b");
  back.addColorStop(1, "#9d174d");
  ctx.fillStyle = back;
  ctx.globalAlpha = 0.55 + Math.sin(time * 0.002) * 0.08;
  ctx.fillRect(L, T, R - L, B - T);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#3b2416";
  ctx.lineWidth = 3;
  ctx.strokeRect(L, T, R - L, B - T);

  let k = 0;
  for (const shelfY of [80, 104]) {
    ctx.fillStyle = "#5b3a29";
    ctx.fillRect(L, shelfY, R - L, 2.5);
    for (let x = L + 8; x < R - 4; x += 11) {
      if (x > 728 && x < 776) continue;
      const h = 12 + ((k * 7) % 3) * 3;
      drawBottle(ctx, x, shelfY, h, BOTTLE_COLORS[k % BOTTLE_COLORS.length]);
      k++;
    }
  }

  // Neon "BAR"
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#fb923c";
  ctx.shadowBlur = 12;
  ctx.font = "900 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#fed7aa";
  ctx.fillText("BAR", 752, 70);
  ctx.shadowColor = "#ec4899";
  ctx.font = "800 6px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#fbcfe8";
  ctx.fillText("MOCKTAIL", 752, 92);
  ctx.restore();
}

function drawWallCaps(ctx: CanvasRenderingContext2D): void {
  for (const wl of AGL_WALLS) {
    ctx.fillStyle = "#120b1d";
    ctx.fillRect(wl.x, wl.y, wl.w, wl.h);
    ctx.fillStyle = "#2b1d40";
    ctx.fillRect(wl.x, wl.y, wl.w, 3);
    ctx.strokeStyle = "#05030a";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(wl.x, wl.y, wl.w, wl.h);
  }
  // Neon trim under the top cap
  ctx.save();
  ctx.shadowColor = "#ec4899";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(ROOM_L, WALL_TOP - 1, ROOM_R - ROOM_L, 1.5);
  ctx.restore();
}

// ============================================================================
// Lighting drawn over everything (disco ball, beams, vignette)
// ============================================================================

export function drawAglLighting(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY, viewW, viewH, time } = w;
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  const { x: bx, y: by } = DISCO_BALL;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 2 + Math.sin(time * 0.0011 + i * 1.7) * 0.95;
    const color = beatColor(time, i);
    const len = 175;
    const spread = 0.15;
    const ex = bx + Math.cos(angle) * len;
    const ey = by + Math.sin(angle) * len;
    const grad = ctx.createLinearGradient(bx, by, ex, ey);
    grad.addColorStop(0, `${color}55`);
    grad.addColorStop(1, `${color}00`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(angle - spread) * len, by + Math.sin(angle - spread) * len);
    ctx.lineTo(bx + Math.cos(angle + spread) * len, by + Math.sin(angle + spread) * len);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `${color}2a`;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Chain from the ceiling
  ctx.strokeStyle = "rgba(148, 163, 184, 0.7)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(bx, by - 11);
  ctx.lineTo(bx, by - 64);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mirror ball
  const r = 11;
  const ball = ctx.createRadialGradient(bx - 4, by - 4, 1, bx, by, r);
  ball.addColorStop(0, "#ffffff");
  ball.addColorStop(0.5, "#cbd5e1");
  ball.addColorStop(1, "#475569");
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, Math.PI * 2);
  fillStroke(ctx, ball, 1.3, "#0f172a");
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, r - 0.6, 0, Math.PI * 2);
  ctx.clip();
  const spin = (time * 0.004) % 3;
  for (let y = -r; y <= r; y += 3) {
    for (let x = -r - 3; x <= r; x += 3) {
      const lit = (Math.floor((x + spin * 3) / 3) + y / 3 + Math.floor(time / 180)) % 5 === 0;
      if (!lit) continue;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx + x + spin, by + y, 2.4, 2.4);
    }
  }
  ctx.strokeStyle = "rgba(15, 23, 42, 0.25)";
  ctx.lineWidth = 0.6;
  for (let y = -r; y <= r; y += 3) {
    ctx.beginPath();
    ctx.moveTo(bx - r, by + y);
    ctx.lineTo(bx + r, by + y);
    ctx.stroke();
  }
  ctx.restore();
  const glint = (time % 1400) / 1400;
  if (glint < 0.25) drawSparkleStar(ctx, bx + 5, by - 5, 5 * Math.sin(glint * 4 * Math.PI), "#ffffff");

  ctx.restore();

  // Soft vignette
  const vg = ctx.createRadialGradient(
    viewW / 2,
    viewH / 2,
    Math.min(viewW, viewH) * 0.4,
    viewW / 2,
    viewH / 2,
    Math.max(viewW, viewH) * 0.75,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(5, 2, 12, 0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, viewW, viewH);
}

// ============================================================================
// Furniture
// ============================================================================

export function drawAglFurnitureItem(
  w: WorldRenderContext,
  item: AglFurnitureItem,
  highlight: boolean,
  state: AglSceneState = {},
): void {
  const { ctx, cameraX, cameraY, time } = w;
  const r = getAglFurnitureRect(item);
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const x = item.x;
  const T = r.top;
  const F = r.bottom;

  switch (item.id) {
    case "dj_stage":
      drawStage(ctx, r.left, r.right, F, time);
      break;
    case "dj_speaker_left":
    case "dj_speaker_right":
      drawSpeaker(ctx, x, T, F, time);
      break;
    case "dj_booth":
      drawDjBooth(ctx, x, T, F, time);
      break;
    case "bar_back":
      drawBackCabinet(ctx, r.left, r.right, F, time, state);
      break;
    case "bar_counter":
      drawBarCounter(ctx, r.left, r.right, T, F, time, state);
      break;
    case "bar_stools":
      for (const s of item.seats ?? []) drawStool(ctx, s.x, F);
      break;
    case "lounge_sofa_left":
    case "lounge_sofa_right":
      drawVelvetSofa(ctx, x, T, F, item.width);
      break;
    case "lounge_table_left":
    case "lounge_table_right":
      drawLoungeTable(ctx, x, T, F, time);
      break;
    case "photobox":
      drawPhotobox(ctx, r.left, r.right, T, F, time);
      break;
    case "arcade_machine":
      drawArcade(ctx, x, T, F, time);
      break;
    case "doormat":
      drawDoormat(ctx, x, F, time);
      break;
  }

  if (highlight && !item.isExit) {
    const pulse = 0.6 + Math.sin(time * 0.007) * 0.3;
    const top = T - (RISE[item.id] ?? 0);
    ctx.strokeStyle = `rgba(244, 114, 182, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    roundRectPath(ctx, r.left - 5, top - 5, r.right - r.left + 10, F - top + 10, 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawStage(ctx: CanvasRenderingContext2D, L: number, R: number, F: number, time: number): void {
  const top = AGL_BACK_WALL_BOTTOM;
  const front = F - 16;
  groundShadow(ctx, (L + R) / 2, F + 3, (R - L) / 2, 6, 0.4);
  // Platform deck with diamond plate
  ctx.fillStyle = "#221836";
  ctx.fillRect(L, top, R - L, front - top);
  ctx.save();
  ctx.beginPath();
  ctx.rect(L, top, R - L, front - top);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let d = -200; d < R - L + 200; d += 14) {
    ctx.beginPath();
    ctx.moveTo(L + d, top);
    ctx.lineTo(L + d + 120, front);
    ctx.stroke();
  }
  ctx.restore();
  // Front step face with chasing LEDs
  ctx.fillStyle = "#130d20";
  ctx.fillRect(L, front, R - L, F - front);
  ctx.fillStyle = "#a78bfa";
  ctx.fillRect(L, front, R - L, 1.5);
  const n = 22;
  for (let i = 0; i < n; i++) {
    const on = (i + Math.floor(time / 120)) % 6 < 2;
    const cx = L + 8 + i * ((R - L - 16) / (n - 1));
    ctx.fillStyle = on ? beatColor(time, i) : "#2e1f45";
    ctx.beginPath();
    ctx.arc(cx, front + 8, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(L, top, R - L, F - top);
}

function drawSpeaker(ctx: CanvasRenderingContext2D, x: number, T: number, F: number, time: number): void {
  const top = T - 40;
  const face = top + 8;
  groundShadow(ctx, x, F + 1, 19, 4, 0.4);
  roundRectPath(ctx, x - 17, top, 34, 10, 2);
  fillStroke(ctx, "#334155", 1.4, "#0f172a");
  roundRectPath(ctx, x - 17, face, 34, F - face, 2);
  fillStroke(ctx, "#111827", 1.5, "#020617");
  const pulse = Math.max(0, Math.sin(time * 0.016)) * 1.6;
  for (const [cy, rr] of [
    [face + 13, 7],
    [face + 38, 11],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, cy, rr + pulse * (rr / 11), 0, Math.PI * 2);
    fillStroke(ctx, "#1e293b", 1.3, "#475569");
    ctx.beginPath();
    ctx.arc(x, cy, rr * 0.4, 0, Math.PI * 2);
    fillStroke(ctx, "#0f172a", 1, "#64748b");
  }
  ctx.fillStyle = beatColor(time);
  ctx.fillRect(x - 13, F - 4, 26, 1.6);
}

function drawDjBooth(ctx: CanvasRenderingContext2D, x: number, T: number, F: number, time: number): void {
  const W = 136;
  const L = x - W / 2;
  const top = T - 20;
  const face = T - 4;
  groundShadow(ctx, x, F + 1, W / 2, 5, 0.4);
  // Desk top
  roundRectPath(ctx, L, top, W, face - top + 2, 3);
  fillStroke(ctx, "#1f2937", 1.5, "#020617");
  // Turntables
  for (const tx of [-44, 44]) {
    roundRectPath(ctx, x + tx - 15, top + 2, 30, 13, 2);
    fillStroke(ctx, "#0b1220", 1, "#334155");
    ctx.beginPath();
    ctx.ellipse(x + tx - 2, top + 8.5, 9, 4.6, 0, 0, Math.PI * 2);
    fillStroke(ctx, "#09090b", 1, "#475569");
    const a = time * 0.012 * (tx < 0 ? 1 : -1);
    ctx.strokeStyle = "rgba(236,72,153,0.9)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + tx - 2, top + 8.5);
    ctx.lineTo(x + tx - 2 + Math.cos(a) * 7, top + 8.5 + Math.sin(a) * 3.6);
    ctx.stroke();
    ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(x + tx + 11, top + 3);
    ctx.lineTo(x + tx + 5, top + 10);
    ctx.stroke();
  }
  // Mixer
  roundRectPath(ctx, x - 13, top + 1, 26, 14, 2);
  fillStroke(ctx, "#111827", 1, "#475569");
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = NEON[i];
    ctx.beginPath();
    ctx.arc(x - 8 + i * 5.3, top + 5, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(x - 9 + i * 5.3, top + 9 + Math.sin(time * 0.004 + i) * 1.5, 2.4, 1.6);
  }
  // Front face with equalizer & logo
  ctx.fillStyle = "#0b0814";
  ctx.fillRect(L, face, W, F - face);
  ctx.strokeStyle = "#ec4899";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(L, face, W, F - face);
  const bars = 14;
  for (let b = 0; b < bars; b++) {
    const bh = 3 + Math.abs(Math.sin(time * 0.013 + b * 0.7)) * 14;
    ctx.fillStyle = b % 3 === 0 ? "#06b6d4" : b % 3 === 1 ? "#ec4899" : "#a855f7";
    ctx.fillRect(L + 8 + b * 6, F - 6 - bh, 4, bh);
  }
  ctx.save();
  ctx.shadowColor = "#f472b6";
  ctx.shadowBlur = 8;
  ctx.font = "900 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fbcfe8";
  ctx.fillText("AGL", x + 44, face + (F - face) / 2);
  ctx.restore();
}

function drawBackCabinet(
  ctx: CanvasRenderingContext2D,
  L: number,
  R: number,
  F: number,
  time: number,
  state: AglSceneState,
): void {
  const frame = state.barista ?? null;
  const order = state.order ?? null;
  const top = BAR_BACK_TOP_Y - 12;
  const face = BAR_BACK_TOP_Y + 6;
  const bottom = face + 20;

  // Rubber mat along the barista walkway
  ctx.fillStyle = "#141018";
  ctx.fillRect(L + 6, bottom, R - L - 12, F - bottom);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let x = L + 10; x < R - 8; x += 8) ctx.fillRect(x, bottom + 2, 3, F - bottom - 4);

  // Cabinet top + front
  ctx.fillStyle = "#3f2a1d";
  ctx.fillRect(L + 4, top, R - L - 8, face - top);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(L + 4, top, R - L - 8, 2);
  ctx.fillStyle = "#2a1a12";
  ctx.fillRect(L + 4, face, R - L - 8, bottom - face);
  for (let x = L + 12; x < R - 30; x += 40) {
    roundRectPath(ctx, x, face + 3, 34, bottom - face - 6, 2);
    fillStroke(ctx, "#33201a", 1, "#1a0f0a");
    ctx.fillStyle = "#b08d57";
    ctx.fillRect(x + 15, face + 9, 4, 1.5);
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(L + 4, top, R - L - 8, bottom - top);

  const surface = BAR_BACK_TOP_Y;

  // Glass rack
  const gx = BAR_STATIONS.glass + 18;
  roundRectPath(ctx, gx - 16, surface - 3, 32, 4, 1);
  fillStroke(ctx, "#94a3b8", 1, "#334155");
  const taken = frame && frame.hasGlass ? 1 : 0;
  for (let i = 0; i < 3 - taken; i++) {
    drawUpsideDownGlass(ctx, gx - 10 + i * 10, surface - 3);
  }

  // Ice bin
  const ix = BAR_STATIONS.ice + 18;
  roundRectPath(ctx, ix - 14, surface - 12, 28, 12, 2);
  fillStroke(ctx, "#cbd5e1", 1.2, "#475569");
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(ix - 11, surface - 10, 22, 4);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(ix - 10 + i * 4.3, surface - 11 + (i % 2), 3.2, 3.2);
  }

  // Syrup bottles + shaker near the middle
  drawBottle(ctx, BAR_STATIONS.center - 12, surface, 16, "#ec4899");
  drawBottle(ctx, BAR_STATIONS.center - 4, surface, 14, "#f59e0b");
  roundRectPath(ctx, BAR_STATIONS.center + 6, surface - 14, 8, 14, 2.5);
  fillStroke(ctx, "#e2e8f0", 1, "#475569");

  // Blender
  const bx = BAR_STATIONS.blender + 18;
  const blending = frame?.act === "blend" && order === "popice";
  const jarAway = frame?.act === "pourBlend";
  const shake = blending ? Math.sin(time * 0.09) * 1.2 : 0;
  roundRectPath(ctx, bx - 8, surface - 8, 16, 8, 2);
  fillStroke(ctx, "#1e1b4b", 1.2, "#0f0a2a");
  ctx.fillStyle = blending ? "#22c55e" : "#64748b";
  ctx.beginPath();
  ctx.arc(bx, surface - 4, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (!jarAway) {
    const jx = bx + shake;
    const jt = surface - 30;
    ctx.beginPath();
    ctx.moveTo(jx - 7, jt);
    ctx.lineTo(jx + 7, jt);
    ctx.lineTo(jx + 5, surface - 8);
    ctx.lineTo(jx - 5, surface - 8);
    ctx.closePath();
    ctx.fillStyle = "rgba(226, 240, 255, 0.4)";
    ctx.fill();
    if (blending && frame) {
      const level = 6 + frame.actProgress * 12;
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "#a16a46";
      ctx.fillRect(jx - 8, surface - 8 - level, 16, level);
      ctx.strokeStyle = "#f5e1c8";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(jx, surface - 8 - level / 2, 3 + Math.sin(time * 0.05) * 1.5, level / 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // Motion lines + flying meses
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(jx + s * 10, jt + 6);
        ctx.lineTo(jx + s * 14, jt + 4);
        ctx.moveTo(jx + s * 10, jt + 12);
        ctx.lineTo(jx + s * 15, jt + 12);
        ctx.stroke();
      }
      ctx.fillStyle = "#3b1d0b";
      for (let m = 0; m < 5; m++) {
        const mp = (time * 0.004 + m * 0.2) % 1;
        ctx.fillRect(jx + Math.sin(m * 2.1 + time * 0.01) * 10, jt - 2 - mp * 12, 2, 1);
      }
    }
    ctx.beginPath();
    ctx.moveTo(jx - 7, jt);
    ctx.lineTo(jx + 7, jt);
    ctx.lineTo(jx + 5, surface - 8);
    ctx.lineTo(jx - 5, surface - 8);
    ctx.closePath();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    roundRectPath(ctx, jx - 8, jt - 3, 16, 4, 1.5);
    fillStroke(ctx, "#334155", 1, "#0f172a");
  }

  // Soda fountain tower
  const sx = BAR_STATIONS.soda + 18;
  roundRectPath(ctx, sx - 11, surface - 36, 22, 36, 3);
  fillStroke(ctx, "#cbd5e1", 1.3, "#334155");
  for (const [i, c] of [
    [0, "#22c55e"],
    [1, "#dc2626"],
    [2, "#f8fafc"],
  ] as const) {
    ctx.beginPath();
    ctx.arc(sx - 6 + i * 6, surface - 28, 2.3, 0, Math.PI * 2);
    fillStroke(ctx, c, 0.8, "#1e293b");
  }
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(sx - 9, surface - 4, 18, 3);
  if (frame?.act !== "pour") {
    // Soda gun resting in its holster
    ctx.fillStyle = "#475569";
    ctx.fillRect(sx + 9, surface - 22, 4, 10);
  }
}

function drawUpsideDownGlass(ctx: CanvasRenderingContext2D, x: number, bottom: number): void {
  ctx.beginPath();
  ctx.moveTo(x - 4, bottom);
  ctx.lineTo(x + 4, bottom);
  ctx.lineTo(x + 3.2, bottom - 11);
  ctx.lineTo(x - 3.2, bottom - 11);
  ctx.closePath();
  ctx.fillStyle = "rgba(226, 240, 255, 0.45)";
  ctx.fill();
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

function drawBarCounter(
  ctx: CanvasRenderingContext2D,
  L: number,
  R: number,
  T: number,
  F: number,
  time: number,
  state: AglSceneState,
): void {
  const top = T - 26;
  const face = T - 6;
  groundShadow(ctx, (L + R) / 2, F + 2, (R - L) / 2, 6, 0.4);

  // Marble top
  roundRectPath(ctx, L - 4, top, R - L + 8, face - top + 2, 4);
  fillStroke(ctx, "#e7e5e4", 1.6);
  ctx.strokeStyle = "rgba(120, 113, 108, 0.35)";
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 7; i++) {
    const vx = L + 20 + i * 38;
    ctx.beginPath();
    ctx.moveTo(vx, top + 3);
    ctx.quadraticCurveTo(vx + 10, top + 10, vx + 4, face - 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(L, top + 2, R - L, 2);

  // Front face: dark wood slats, brass rail, neon strip
  ctx.fillStyle = "#2a1a12";
  ctx.fillRect(L, face + 2, R - L, F - face - 2);
  for (let x = L + 6; x < R; x += 12) {
    ctx.fillStyle = "#3a2418";
    ctx.fillRect(x, face + 4, 8, F - face - 10);
  }
  ctx.fillStyle = "#b08d57";
  ctx.fillRect(L, face + 10, R - L, 2.5);
  ctx.save();
  ctx.shadowColor = "#ec4899";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(L + 2, F - 5, R - L - 4, 2);
  ctx.restore();
  // Emblem
  const cx = (L + R) / 2;
  ctx.beginPath();
  ctx.arc(cx, face + 24, 9, 0, Math.PI * 2);
  fillStroke(ctx, "#1a0f0a", 1.4, "#b08d57");
  ctx.font = "900 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fde68a";
  ctx.fillText("AGL", cx, face + 24.5);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(L, face + 2, R - L, F - face - 2);

  // Decor at the ends: straws & napkins, tip jar
  const surf = BAR_COUNTER_TOP_Y;
  roundRectPath(ctx, L + 6, surf - 10, 9, 10, 2);
  fillStroke(ctx, "#f8fafc", 1, "#64748b");
  for (const [i, c] of [
    [0, "#ef4444"],
    [1, "#22c55e"],
    [2, "#ec4899"],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(L + 8 + i * 2.5, surf - 9);
    ctx.lineTo(L + 7 + i * 3, surf - 17);
    ctx.stroke();
  }
  roundRectPath(ctx, L + 18, surf - 5, 12, 5, 1);
  fillStroke(ctx, "#fef3c7", 1, "#a16207");
  roundRectPath(ctx, R - 18, surf - 12, 11, 12, 3);
  fillStroke(ctx, "rgba(226,240,255,0.5)", 1, "#64748b");
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(R - 16, surf - 6, 7, 4);
  ctx.font = "800 5px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#fde68a";
  ctx.fillText("TIPS", R - 12.5, surf - 15);

  // Served / finished drink
  const cd = state.counterDrink;
  if (cd) {
    drawBarGlass(ctx, cd.x, surf, cd.drink, {
      fill: cd.empty ? 0 : 0.9,
      ice: cd.empty ? 0.6 : 1,
      garnished: true,
      time,
    });
    if (!cd.empty) {
      // Cold mist
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < 3; i++) {
        const p = (time * 0.0012 + i / 3) % 1;
        ctx.beginPath();
        ctx.arc(cd.x - 6 + i * 6, surf - 22 - p * 10, 2 + p * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Drink being finished in front of Dymas
  const f = state.barista;
  const drink = state.order;
  if (f && drink && (f.act === "garnish" || f.act === "serve")) {
    const gy = f.act === "serve" ? surf - 5 + 5 * ease(f.actProgress) : surf;
    drawBarGlass(ctx, f.x, gy, drink, { fill: f.fill, ice: f.ice, garnished: f.garnished, time });
    if (f.act === "garnish") drawGarnishFx(ctx, f.x, gy, drink, f.actProgress, time);
    else if (f.actProgress > 0.3) {
      drawSparkleStar(ctx, f.x + 11, gy - 20, 3.5, "#fde047");
      drawSparkleStar(ctx, f.x - 10, gy - 12, 2.5, "#f0abfc");
    }
  }
}

function drawGarnishFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  gy: number,
  drink: DrinkId,
  p: number,
  time: number,
): void {
  const rim = gy - 16;
  const k = ease(Math.min(1, p / 0.6));
  if (p < 0.6) {
    if (drink === "sprite") {
      const ly = rim - 22 + 22 * k;
      ctx.beginPath();
      ctx.arc(x - 5, ly, 3.4, 0, Math.PI * 2);
      fillStroke(ctx, "#fde047", 0.8, "#a16207");
    } else if (drink === "cola") {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x + 2, rim - 24 + 20 * k);
      ctx.lineTo(x + 4, rim - 34 + 20 * k);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#3b1d0b";
      for (let i = 0; i < 8; i++) {
        const fp = (time * 0.004 + i / 8) % 1;
        ctx.fillRect(x - 5 + ((i * 3) % 10), rim - 18 + fp * 16, 1.6, 0.9);
      }
    }
  } else {
    const s = (p - 0.6) / 0.4;
    drawSparkleStar(ctx, x + 9, rim - 6 - s * 6, 3.6 * (1 - s * 0.4), "#fde047");
    drawSparkleStar(ctx, x - 9, rim - 2 - s * 8, 2.6, "#f0abfc");
  }
}

function drawStool(ctx: CanvasRenderingContext2D, x: number, F: number): void {
  groundShadow(ctx, x, F, 9, 3, 0.35);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(x - 1.5, F - 14, 3, 14);
  ctx.beginPath();
  ctx.ellipse(x, F - 1, 6, 2, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#64748b", 1, "#1e293b");
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, F - 6, 5.5, 1.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Cushion with side thickness
  roundRectPath(ctx, x - 10, F - 18, 20, 6, 3);
  fillStroke(ctx, "#9d174d", 1.2);
  ctx.beginPath();
  ctx.ellipse(x, F - 18, 10, 3.6, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#db2777", 1.2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.ellipse(x - 3, F - 19, 4, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawVelvetSofa(ctx: CanvasRenderingContext2D, x: number, T: number, F: number, W: number): void {
  const body = "#5b2a86";
  const half = W / 2;
  groundShadow(ctx, x, F + 2, half + 4, 7, 0.4);
  // Neon underglow
  ctx.save();
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(168, 85, 247, 0.5)";
  ctx.fillRect(x - half + 10, F - 2, W - 20, 3);
  ctx.restore();
  // Backrest (tufted)
  roundRectPath(ctx, x - half + 2, T - 16, W - 4, 32, 9);
  fillStroke(ctx, shade(body, -20), 1.6);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let bx = x - half + 18; bx < x + half - 10; bx += 16) {
    for (const by of [T - 8, T + 2]) {
      ctx.beginPath();
      ctx.arc(bx + (by === T + 2 ? 8 : 0), by, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Seat cushions
  const n = 3;
  const cw = (W - 36) / n;
  for (let i = 0; i < n; i++) {
    roundRectPath(ctx, x - half + 18 + i * cw + 1, T + 12, cw - 2, 26, 5);
    fillStroke(ctx, body, 1.4);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x - half + 22 + i * cw, T + 15, cw - 10, 3);
  }
  // Throw pillows
  roundRectPath(ctx, x - half + 20, T - 4, 20, 16, 5);
  fillStroke(ctx, "#ec4899", 1.2);
  roundRectPath(ctx, x + half - 40, T - 4, 20, 16, 5);
  fillStroke(ctx, "#22d3ee", 1.2);
  // Armrests
  for (const ax of [x - half, x + half - 18]) {
    roundRectPath(ctx, ax, T - 4, 18, F - T + 2, 7);
    fillStroke(ctx, shade(body, -10), 1.5);
  }
  // Front face + gold feet
  ctx.fillStyle = shade(body, -40);
  ctx.fillRect(x - half + 16, F - 10, W - 32, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - half + 16, F - 10, W - 32, 10);
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(x - half + 4, F - 1, 5, 4);
  ctx.fillRect(x + half - 9, F - 1, 5, 4);
}

function drawLoungeTable(ctx: CanvasRenderingContext2D, x: number, T: number, F: number, time: number): void {
  const cy = T + 12;
  groundShadow(ctx, x, F + 1, 44, 6, 0.35);
  ctx.fillStyle = "#1e1b2e";
  ctx.fillRect(x - 30, cy, 4, F - cy);
  ctx.fillRect(x + 26, cy, 4, F - cy);
  ctx.beginPath();
  ctx.ellipse(x, cy + 4, 46, 13, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#2e1f45", 1.4);
  ctx.beginPath();
  ctx.ellipse(x, cy, 46, 13, 0, 0, Math.PI * 2);
  fillStroke(ctx, "rgba(148, 163, 184, 0.35)", 1.6, "#a855f7");
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(x - 14, cy - 5, 14, 3, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Mocktails, snack bowl, candle
  ctx.save();
  ctx.translate(x - 22, cy + 6);
  ctx.scale(0.75, 0.75);
  drawBarGlass(ctx, 0, 0, "sprite", { fill: 0.55, ice: 1, garnished: true, time });
  drawBarGlass(ctx, 16, 0, "cola", { fill: 0.4, ice: 0.6, garnished: true, time });
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(x + 10, cy + 2, 9, 4, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#f8fafc", 1, "#64748b");
  ctx.fillStyle = "#f59e0b";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x + 5 + i * 2.4, cy + 1 - (i % 2), 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  const fl = Math.sin(time * 0.02) * 0.6;
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(x + 27, cy - 6, 5, 7);
  ctx.save();
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.ellipse(x + 29.5 + fl * 0.4, cy - 9, 1.6, 2.8 + fl, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPhotobox(
  ctx: CanvasRenderingContext2D,
  L: number,
  R: number,
  T: number,
  F: number,
  time: number,
): void {
  const top = T - 54;
  const face = top + 10;
  const W = R - L;
  groundShadow(ctx, (L + R) / 2, F + 1, W / 2 + 2, 5, 0.4);
  // Roof
  roundRectPath(ctx, L, top, W, 12, 3);
  fillStroke(ctx, "#3b1d5e", 1.4, "#0f0a1a");
  // Body
  ctx.fillStyle = "#1e1033";
  ctx.fillRect(L, face, W, F - face);
  // Curtain (left)
  const cL = L + 4;
  const cR = L + W * 0.55;
  ctx.fillStyle = "#be185d";
  ctx.fillRect(cL, face + 4, cR - cL, F - face - 6);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  for (let x = cL + 4; x < cR; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x, face + 4);
    ctx.lineTo(x + Math.sin(time * 0.002 + x) * 0.8, F - 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#facc15";
  ctx.fillRect(cL, face + 2, cR - cL, 2);
  // Camera panel & photo strips (right)
  roundRectPath(ctx, cR + 3, face + 6, R - cR - 7, 14, 2);
  fillStroke(ctx, "#0f172a", 1, "#475569");
  ctx.beginPath();
  ctx.arc((cR + R) / 2 - 1, face + 13, 3.2, 0, Math.PI * 2);
  fillStroke(ctx, "#1e293b", 1, "#94a3b8");
  for (let i = 0; i < 2; i++) {
    const sx = cR + 5 + i * 9;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(sx, face + 26, 7, 22);
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = NEON[(i + j) % NEON.length];
      ctx.fillRect(sx + 1, face + 27.5 + j * 7, 5, 5);
    }
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(L, face, W, F - face);
  // Neon sign
  ctx.save();
  ctx.shadowColor = "#facc15";
  ctx.shadowBlur = 8;
  ctx.font = "900 7.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef08a";
  ctx.fillText("PHOTOBOX", (L + R) / 2, top + 6);
  ctx.restore();
  // Flash
  const t = time % 4200;
  if (t < 160) {
    ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - t / 160)})`;
    ctx.fillRect(cL, face + 4, cR - cL, F - face - 6);
  }
}

function drawArcade(ctx: CanvasRenderingContext2D, x: number, T: number, F: number, time: number): void {
  const top = T - 48;
  const W = 46;
  const L = x - W / 2;
  groundShadow(ctx, x, F + 1, W / 2 + 2, 5, 0.4);
  // Cabinet shell
  roundRectPath(ctx, L, top, W, F - top, 4);
  fillStroke(ctx, "#312e81", 1.6, "#0f0a2a");
  ctx.fillStyle = "#ec4899";
  ctx.fillRect(L + 2, top + 16, 3, F - top - 20);
  ctx.fillRect(L + W - 5, top + 16, 3, F - top - 20);
  // Marquee
  ctx.save();
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 8;
  roundRectPath(ctx, L + 3, top + 3, W - 6, 11, 2);
  fillStroke(ctx, "#0e7490", 1, "#164e63");
  ctx.font = "900 6.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ecfeff";
  ctx.fillText("ARCADE", x, top + 9);
  ctx.restore();
  // Screen with a tiny runner game
  const sT = top + 17;
  const sH = 22;
  roundRectPath(ctx, L + 6, sT, W - 12, sH, 2);
  fillStroke(ctx, "#020617", 1.2, "#0f172a");
  ctx.save();
  ctx.beginPath();
  ctx.rect(L + 7, sT + 1, W - 14, sH - 2);
  ctx.clip();
  ctx.fillStyle = "#166534";
  ctx.fillRect(L + 7, sT + sH - 5, W - 14, 4);
  const scroll = (time * 0.03) % (W - 10);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(L + W - 8 - scroll, sT + sH - 9, 3, 4);
  const jump = Math.max(0, Math.sin(time * 0.008)) * 7;
  ctx.fillStyle = "#facc15";
  ctx.fillRect(L + 12, sT + sH - 10 - jump, 4, 5);
  ctx.fillStyle = "#fff";
  ctx.font = "700 4.5px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(String(9000 + (Math.floor(time / 90) % 999)), L + W - 8, sT + 5);
  ctx.restore();
  // Control panel
  ctx.beginPath();
  ctx.moveTo(L + 2, sT + sH + 2);
  ctx.lineTo(L + W - 2, sT + sH + 2);
  ctx.lineTo(L + W, sT + sH + 11);
  ctx.lineTo(L, sT + sH + 11);
  ctx.closePath();
  fillStroke(ctx, "#4338ca", 1.2, "#0f0a2a");
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x - 13, sT + sH + 4, 2, 4);
  ctx.beginPath();
  ctx.arc(x - 12, sT + sH + 4, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  for (const [i, c] of [
    [0, "#facc15"],
    [1, "#22c55e"],
    [2, "#3b82f6"],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + 2 + i * 5, sT + sH + 7, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  }
  // Coin door
  roundRectPath(ctx, x - 6, F - 13, 12, 9, 1.5);
  fillStroke(ctx, "#1e1b4b", 1, "#64748b");
  ctx.fillStyle = Math.sin(time * 0.01) > 0 ? "#f97316" : "#7c2d12";
  ctx.fillRect(x - 1, F - 11, 2, 5);
}

function drawDoormat(ctx: CanvasRenderingContext2D, x: number, F: number, time: number): void {
  roundRectPath(ctx, x - 44, F - 24, 88, 22, 4);
  fillStroke(ctx, "#3b1e54", 2, "#ec4899");
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 39, F - 20, 78, 14);
  const bob = Math.sin(time * 0.005) * 1.5;
  ctx.font = "800 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fde047";
  ctx.fillText("▼ KELUAR", x, F - 13 + bob);
}

// ============================================================================
// NPCs
// ============================================================================

export function drawAglNpc(
  w: WorldRenderContext,
  npc: AglNpcData,
  nearPlayer: boolean,
  state: AglSceneState = {},
): void {
  const { ctx, cameraX, cameraY, time } = w;
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (npc.id === "dymas") {
    drawDymas(ctx, npc, nearPlayer, state, time);
  } else {
    drawGuest(ctx, npc, nearPlayer, time);
  }

  ctx.restore();
}

const NPC_SCALE = 1.04;

function drawNameTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.font = "700 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width + 10;
  roundRectPath(ctx, x - tw / 2, y - 7, tw, 14, 4);
  fillStroke(ctx, "rgba(24, 19, 43, 0.92)", 1.2, "#ec4899");
  ctx.fillStyle = "#fde68a";
  ctx.fillText(text, x, y + 0.5);
}

function drawGuest(ctx: CanvasRenderingContext2D, npc: AglNpcData, near: boolean, time: number): void {
  const seed = npc.x * 0.05;
  let facing: Facing = npc.facing;
  let hop = 0;
  let moving = false;
  let waving = false;

  if (npc.sitting) {
    waving = near && Math.floor(time / 1800) % 2 === 0;
  } else if (npc.id === "valdy") {
    hop = Math.abs(Math.sin(time * 0.0105)) * 2;
    waving = Math.floor(time / 1400) % 3 === 0;
  } else if (npc.dancing) {
    const beat = time * 0.0105 + seed;
    hop = Math.abs(Math.sin(beat)) * 3.4;
    const seq: Facing[] = ["down", "left", "down", "right"];
    facing = seq[Math.floor(time / 760 + seed) % seq.length];
    moving = facing !== "down";
    waving = facing === "down" && Math.sin(beat * 0.5) > 0.2;
  }

  drawCharacter(
    ctx,
    npc.x,
    npc.y - hop,
    npc.look,
    {
      facing,
      moving,
      walkTime: time * 0.9,
      waving,
      waveTime: time,
      time,
      seed,
      sitting: npc.sitting,
    },
    NPC_SCALE,
  );

  if (npc.id === "valdy") {
    const hy = npc.y - hop - 38.5;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(npc.x, hy, 13.4, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    for (const s of [-1, 1]) {
      roundRectPath(ctx, npc.x + s * 13 - 3, hy - 2, 6, 9, 2.5);
      fillStroke(ctx, "#ec4899", 1.1);
    }
  }

  // Music notes over the dancers
  if (npc.dancing && npc.id !== "valdy") {
    const p = (time * 0.0011 + seed) % 1;
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = beatColor(time, Math.floor(seed));
    ctx.font = "900 10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("♪", npc.x + 14 + Math.sin(p * 6) * 3, npc.y - 46 - p * 16);
    ctx.globalAlpha = 1;
  }

  if (near) {
    const headTop = npc.y - hop - (npc.sitting ? 46 : 54);
    drawNameTag(ctx, npc.x, headTop - 4, npc.name);
    const greet = npc.greetings[Math.floor(time / 2200) % npc.greetings.length];
    drawSpeechBubble(ctx, npc.x, headTop - 18, greet, time);
  }
}

function drawDymas(
  ctx: CanvasRenderingContext2D,
  npc: AglNpcData,
  near: boolean,
  state: AglSceneState,
  time: number,
): void {
  const f = state.barista ?? null;
  const drink = state.order ?? null;
  const y = npc.y;

  if (!f || !drink) {
    // Idle: polishing a glass with a towel
    const x = npc.x;
    drawCharacter(
      ctx,
      x,
      y,
      npc.look,
      { facing: "down", moving: false, walkTime: 0, waving: false, waveTime: 0, time, seed: 1, holdArms: 1 },
      NPC_SCALE,
    );
    drawApron(ctx, x, y, true);
    const handY = y - 17.6;
    drawBarGlass(ctx, x, handY + 8, "sprite", { fill: 0, ice: 0, garnished: false, time });
    const a = time * 0.012;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 3, handY - 1 + Math.sin(a) * 3, 5, 4, a, 0, Math.PI * 2);
    fillStroke(ctx, "#f1f5f9", 1, "#94a3b8");
    if (Math.floor(time / 1600) % 3 === 0) {
      drawSparkleStar(ctx, x + 8, handY - 8, 3 * Math.abs(Math.sin(time * 0.006)), "#ffffff");
    }
    if (near) {
      drawNameTag(ctx, x, y - 58, "Dymas • Barista");
      const greet = npc.greetings[Math.floor(time / 2200) % npc.greetings.length];
      drawSpeechBubble(ctx, x, y - 72, greet, time);
    }
    return;
  }

  const x = f.x;
  const facing = f.facing;
  const back = facing === "up" && !!f.act;
  let hold: number | undefined;
  if (back) hold = f.act === "blend" ? 2.95 : 2.8;
  else if (f.act === "garnish") hold = 1.2;
  else if (f.act === "serve") hold = 0.75 + 0.35 * f.actProgress;

  const workGlassOnBack =
    f.hasGlass && !!f.act && (f.act === "ice" || f.act === "pour" || f.act === "blend" || f.act === "pourBlend");
  const glassX = x - 18;
  const surface = BAR_BACK_TOP_Y;

  if (workGlassOnBack) {
    drawBarGlass(ctx, glassX, surface, drink, { fill: f.fill, ice: f.ice, garnished: false, time });
  }

  const bounce = f.act === "blend" ? Math.sin(time * 0.06) * 0.8 : 0;
  drawCharacter(
    ctx,
    x,
    y + bounce,
    npc.look,
    {
      facing,
      moving: f.walking,
      walkTime: time,
      waving: false,
      waveTime: 0,
      time,
      seed: 1,
      holdArms: hold,
    },
    NPC_SCALE,
  );
  drawApron(ctx, x, y, facing === "down");

  // Station-specific effects
  if (f.act === "glass") {
    const lift = Math.max(0, (f.actProgress - 0.3) / 0.7);
    if (f.actProgress > 0.3) {
      drawBarGlass(ctx, BAR_STATIONS.glass + 8, surface - 2 - lift * 10, drink, {
        fill: 0,
        ice: 0,
        garnished: false,
        time,
      });
    }
  } else if (f.act === "ice") {
    const k = (f.actProgress * 3) % 1;
    const fromX = BAR_STATIONS.ice + 18;
    const cx = fromX + (glassX - fromX) * k;
    const cy = surface - 10 - Math.sin(k * Math.PI) * 14 + k * 2;
    ctx.fillStyle = "rgba(240, 249, 255, 0.95)";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.7;
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
    ctx.strokeRect(cx - 2, cy - 2, 4, 4);
    if (k > 0.85) drawClinkText(ctx, glassX - 10, surface - 22, "klink!", time);
  } else if (f.act === "pour") {
    const nozzleX = glassX + 2;
    const nozzleY = surface - 30;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(BAR_STATIONS.soda + 18, surface - 14);
    ctx.quadraticCurveTo(x, surface + 2, nozzleX + 4, nozzleY);
    ctx.stroke();
    roundRectPath(ctx, nozzleX - 3, nozzleY - 6, 8, 7, 2);
    fillStroke(ctx, "#94a3b8", 1, "#1e293b");
    const liquidTop = surface - 16 * f.fill;
    drawPourStream(ctx, nozzleX, nozzleY + 1, liquidTop, drink, time);
    // Fizz popping over the rim
    for (let i = 0; i < 4; i++) {
      const p = (time * 0.003 + i / 4) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(glassX - 5 + i * 3.4, surface - 17 - p * 9, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (drink === "cola" && f.actProgress > 0.5) {
      ctx.fillStyle = "#f5e1c8";
      ctx.beginPath();
      ctx.ellipse(glassX, surface - 16, 6.5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (f.act === "blend") {
    if (Math.floor(time / 160) % 2 === 0) drawClinkText(ctx, BAR_STATIONS.blender + 18, surface - 42, "BRRRR", time);
  } else if (f.act === "pourBlend") {
    const px = glassX + 9;
    const py = surface - 34;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.9 * ease(Math.min(1, f.actProgress * 3)));
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(6, -12);
    ctx.lineTo(4.5, 6);
    ctx.lineTo(-4.5, 6);
    ctx.closePath();
    fillStroke(ctx, "rgba(226, 240, 255, 0.55)", 1, "#475569");
    ctx.fillStyle = "#a16a46";
    ctx.fillRect(-4.5, -4 + f.actProgress * 8, 9, Math.max(0, 9 - f.actProgress * 8));
    ctx.restore();
    if (f.actProgress > 0.2) {
      drawPourStream(ctx, glassX + 1, py - 6, surface - 16 * f.fill, drink, time);
    }
  }

  // Glass carried while walking
  if (f.walking && f.hasGlass) {
    const dir = facing === "left" ? -1 : 1;
    const bob = Math.sin(time * 0.013) * 0.6;
    drawBarGlass(ctx, x + dir * 9, y - 9 + bob, drink, { fill: f.fill, ice: f.ice, garnished: f.garnished, time });
  }

  if (f.act === "serve" && f.actProgress > 0.25) {
    drawSpeechBubble(ctx, x, y - 66, "Silakan, Zam! 🍹", time);
  } else {
    drawCraftBanner(ctx, x, y - 70, f, drink);
  }
}

function drawApron(ctx: CanvasRenderingContext2D, x: number, y: number, front: boolean): void {
  if (front) {
    roundRectPath(ctx, x - 6, y - 21, 12, 9, 2);
    fillStroke(ctx, "#f1f5f9", 1, "#64748b");
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(x - 2, y - 18, 4, 2);
  } else {
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 16);
    ctx.lineTo(x + 7, y - 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - 2, y - 15, 2.4, 1.4, 0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 2, y - 15, 2.4, 1.4, -0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawClinkText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, time: number): void {
  ctx.save();
  ctx.font = "900 7.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#1e1b4b";
  const jitter = Math.sin(time * 0.08) * 0.8;
  ctx.strokeText(text, x + jitter, y);
  ctx.fillStyle = "#a5f3fc";
  ctx.fillText(text, x + jitter, y);
  ctx.restore();
}

function drawCraftBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  f: BaristaFrame,
  drink: DrinkId,
): void {
  const color = drink === "sprite" ? "#4ade80" : drink === "cola" ? "#f87171" : "#d6a179";
  const W = 156;
  const H = 32;
  const bx = Math.max(ROOM_L + 4, Math.min(ROOM_R - W - 4, x - W / 2));
  roundRectPath(ctx, bx, y - H, W, H, 7);
  fillStroke(ctx, "rgba(18, 12, 30, 0.94)", 1.6, color);

  ctx.font = "800 8.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(f.label, bx + W / 2, y - H + 9, W - 12);

  // Step dots
  for (let i = 0; i < f.stepCount; i++) {
    const dx = bx + W / 2 + (i - (f.stepCount - 1) / 2) * 11;
    ctx.beginPath();
    ctx.arc(dx, y - 13, 3, 0, Math.PI * 2);
    ctx.fillStyle = i < f.stepIndex ? color : i === f.stepIndex ? "#fde047" : "#3b2a55";
    ctx.fill();
  }

  // Overall progress
  roundRectPath(ctx, bx + 10, y - 7, W - 20, 3.5, 1.75);
  ctx.fillStyle = "#2d1f42";
  ctx.fill();
  roundRectPath(ctx, bx + 10, y - 7, Math.max(3.5, (W - 20) * f.overall), 3.5, 1.75);
  ctx.fillStyle = color;
  ctx.fill();
}
