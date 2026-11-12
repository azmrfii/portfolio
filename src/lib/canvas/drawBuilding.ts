import { OBLIQUE, type BuildingData, type BuildingVisual } from "@/data/worldData";
import { drawFloatingIcon } from "./drawWorld";
import { OUTLINE, fillStroke, polygonPath, roundRectPath, shade } from "./shapes";
import type { WorldRenderContext } from "./types";

type Pt = [number, number];

interface Geo {
  sx: number;
  base: number;
  L: number;
  R: number;
  T: number;
  W: number;
  H: number;
  D: number;
  dx: number;
  dy: number;
}

/**
 * Buildings are drawn as oblique boxes: front wall, a side wall receding
 * up-right, then a gable or flat roof. Swap a style's body for a sprite later.
 */
export function drawBuilding(w: WorldRenderContext, b: BuildingData, highlight = false): void {
  const { ctx, cameraX, cameraY, time } = w;
  const v = b.visual;
  const sx = b.x - cameraX;
  const base = b.y - cameraY;
  const D = v.depth;
  const dx = D * OBLIQUE.x;
  const dy = D * OBLIQUE.y;
  const g: Geo = {
    sx,
    base,
    L: sx - v.width / 2,
    R: sx + v.width / 2,
    T: base - v.wallHeight,
    W: v.width,
    H: v.wallHeight,
    D,
    dx,
    dy,
  };

  if (g.R + dx < -30 || g.L > w.viewW + 30 || base < -30) return;
  if (g.T - v.roofHeight - dy > w.viewH + 30) return;

  ctx.lineJoin = "round";

  // Contact shadow (light from top-left)
  ctx.fillStyle = "rgba(20, 30, 15, 0.24)";
  polygonPath(ctx, [
    [g.L + 2, base + 3],
    [g.R + dx + 14, base + 3],
    [g.R + dx + 14, base - dy + 2],
    [g.L + dx, base - dy + 2],
  ]);
  ctx.fill();

  if (highlight) {
    const pulse = 0.6 + Math.sin(time * 0.006) * 0.3;
    ctx.strokeStyle = `rgba(255, 226, 120, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.ellipse(sx, base + 10, g.W / 2 + 12, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Walls
  polygonPath(ctx, [
    [g.R, base],
    [g.R + dx, base - dy],
    [g.R + dx, g.T - dy],
    [g.R, g.T],
  ]);
  fillStroke(ctx, shade(v.wallColor, -34));
  ctx.beginPath();
  ctx.rect(g.L, g.T, g.W, g.H);
  fillStroke(ctx, v.wallColor);

  // Stone foundation
  ctx.beginPath();
  ctx.rect(g.L, base - 6, g.W, 6);
  fillStroke(ctx, "#9c9284", 1.2);
  polygonPath(ctx, [
    [g.R, base],
    [g.R + dx, base - dy],
    [g.R + dx, base - dy - 6],
    [g.R, base - 6],
  ]);
  fillStroke(ctx, "#7d7468", 1.2);

  switch (v.style) {
    case "home":
      drawHome(ctx, g, v);
      break;
    case "school":
      drawSchool(ctx, g, v, time);
      break;
    case "campus":
      drawCampus(ctx, g, v, time);
      break;
    case "office":
      drawOffice(ctx, g, v, b.shortLabel);
      break;
  }

  drawSign(ctx, sx, base + 8, b.shortLabel, b.signLines);

  if (b.hasFloatingIcon) {
    drawFloatingIcon(ctx, sx + dx / 2, g.T - v.roofHeight - dy / 2 - 16, time);
  }
}

/* ---------- styles ---------- */

function drawHome(ctx: CanvasRenderingContext2D, g: Geo, v: BuildingVisual): void {
  // Front windows with shutters + flower boxes
  const wy = g.T + 14;
  windowFront(ctx, g.L + 10, wy, 18, 18, v.windowColor, "#ffffff", v.trimColor);
  windowFront(ctx, g.R - 28, wy, 18, 18, v.windowColor, "#ffffff", v.trimColor);
  for (const fx of [g.L + 8, g.R - 30]) {
    roundRectPath(ctx, fx, wy + 21, 22, 5, 1);
    fillStroke(ctx, "#8b5a2b", 1.1);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ["#f472b6", "#fbbf24", "#f87171", "#a78bfa"][i];
      ctx.beginPath();
      ctx.arc(fx + 3 + i * 5.3, wy + 20, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  door(ctx, g.sx, g.base, 16, 28, v.doorColor);

  // Side window
  onSide(ctx, g, () => {
    windowRaw(ctx, g.D * 0.32, -g.H + 14, 16, 18, v.windowColor, "#f5f5f5");
  });

  gableRoof(ctx, g, v);

  // Chimney sitting on the right slope
  const apex: Pt = [g.sx, g.T - v.roofHeight];
  const eR: Pt = [g.R + 7, g.T + 3];
  const p = lerp(apex, eR, 0.42);
  const cx = p[0] + g.dx * 0.55;
  const cy = p[1] - g.dy * 0.55;
  box(ctx, cx - 6, cy + 6, 12, 22, 8, "#a0522d");
  // Attic round window
  ctx.beginPath();
  ctx.arc(g.sx, g.T - v.roofHeight * 0.38, 5, 0, Math.PI * 2);
  fillStroke(ctx, v.windowColor, 1.4);
  crossLines(ctx, g.sx - 5, g.T - v.roofHeight * 0.38 - 5, 10, 10, "#ffffff");
}

function drawSchool(ctx: CanvasRenderingContext2D, g: Geo, v: BuildingVisual, time: number): void {
  const floors = v.floors;
  const floorH = g.H / floors;

  // Floor divider bands
  for (let f = 1; f < floors; f++) {
    ctx.beginPath();
    ctx.rect(g.L, g.T + f * floorH - 2, g.W, 4);
    fillStroke(ctx, v.trimColor, 1);
  }
  ctx.beginPath();
  ctx.rect(g.L, g.base - 14, g.W, 3);
  ctx.fillStyle = shade(v.wallColor, -20);
  ctx.fill();

  const winW = 15;
  const winH = Math.min(18, floorH - 18);
  for (let f = 0; f < floors; f++) {
    const y = g.T + f * floorH + (floorH - winH) / 2 - 2;
    const isGround = f === floors - 1;
    const count = Math.max(2, Math.floor((g.W - 16) / 24));
    const gap = (g.W - count * winW) / (count + 1);
    for (let i = 0; i < count; i++) {
      const x = g.L + gap + i * (winW + gap);
      if (isGround && Math.abs(x + winW / 2 - g.sx) < 18) continue;
      windowFront(ctx, x, y, winW, winH, v.windowColor, "#ffffff");
    }
  }

  // Double door with canopy
  door(ctx, g.sx, g.base, 22, 26, v.doorColor, true);
  polygonPath(ctx, [
    [g.sx - 17, g.base - 30],
    [g.sx + 17, g.base - 30],
    [g.sx + 13, g.base - 36],
    [g.sx - 13, g.base - 36],
  ]);
  fillStroke(ctx, v.roofColor, 1.2);

  // Side windows per floor
  onSide(ctx, g, () => {
    for (let f = 0; f < floors; f++) {
      const y = -g.H + f * floorH + (floorH - winH) / 2 - 2;
      windowRaw(ctx, g.D * 0.18, y, 12, winH, v.windowColor, "#eeeeee");
      windowRaw(ctx, g.D * 0.58, y, 12, winH, v.windowColor, "#eeeeee");
    }
  });

  gableRoof(ctx, g, v);

  // Clock in the gable
  const cy = g.T - v.roofHeight * 0.4;
  ctx.beginPath();
  ctx.arc(g.sx, cy, 6.5, 0, Math.PI * 2);
  fillStroke(ctx, "#fffdf5", 1.4);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(g.sx, cy);
  ctx.lineTo(g.sx, cy - 4);
  ctx.moveTo(g.sx, cy);
  ctx.lineTo(g.sx + 3, cy + 1);
  ctx.stroke();

  flagPole(ctx, g.L - 12, g.base, g.H + v.roofHeight + 6, time);
}

function drawCampus(ctx: CanvasRenderingContext2D, g: Geo, v: BuildingVisual, time: number): void {
  const floors = v.floors;
  const floorH = (g.H - 6) / floors;

  // Cornice bands
  for (let f = 1; f < floors; f++) {
    ctx.beginPath();
    ctx.rect(g.L, g.T + 6 + f * floorH - 1.5, g.W, 3);
    ctx.fillStyle = shade(v.wallColor, -22);
    ctx.fill();
  }

  // Windows (skip portico area on lower floors)
  const winW = 13;
  const winH = floorH - 12;
  const cols = 6;
  const gap = (g.W - cols * winW) / (cols + 1);
  for (let f = 0; f < floors; f++) {
    const y = g.T + 6 + f * floorH + 5;
    for (let i = 0; i < cols; i++) {
      const x = g.L + gap + i * (winW + gap);
      if (f >= floors - 2 && Math.abs(x + winW / 2 - g.sx) < 30) continue;
      windowFront(ctx, x, y, winW, winH, v.windowColor, "#f8f5ee");
    }
  }

  onSide(ctx, g, () => {
    for (let f = 0; f < floors; f++) {
      const y = -g.H + 6 + f * floorH + 5;
      for (let i = 0; i < 3; i++) {
        windowRaw(ctx, 8 + i * (g.D / 3.2), y, 11, winH, v.windowColor, "#e8e2d4");
      }
    }
  });

  // Portico: columns + pediment
  const pw = 64;
  const colTop = g.base - floorH * 2 + 4;
  ctx.beginPath();
  ctx.rect(g.sx - pw / 2, colTop, pw, g.base - colTop);
  ctx.fillStyle = shade(v.wallColor, -40);
  ctx.fill();
  door(ctx, g.sx, g.base - 4, 20, 26, v.doorColor, true);
  for (let i = 0; i < 4; i++) {
    const cx = g.sx - pw / 2 + 4 + i * ((pw - 8) / 3);
    roundRectPath(ctx, cx - 3, colTop, 6, g.base - colTop - 4, 1.5);
    fillStroke(ctx, "#f8f5ee", 1.1);
  }
  ctx.beginPath();
  ctx.rect(g.sx - pw / 2 - 4, colTop - 5, pw + 8, 6);
  fillStroke(ctx, "#f1ece0", 1.2);
  polygonPath(ctx, [
    [g.sx - pw / 2 - 6, colTop - 5],
    [g.sx, colTop - 22],
    [g.sx + pw / 2 + 6, colTop - 5],
  ]);
  fillStroke(ctx, "#f1ece0", 1.3);
  // Steps
  for (let s = 0; s < 3; s++) {
    ctx.beginPath();
    ctx.rect(g.sx - pw / 2 - 2 + s * 3, g.base - 4 + s * 2 - 4, pw + 4 - s * 6, 3);
    fillStroke(ctx, "#d6cfc0", 0.8);
  }

  flatRoof(ctx, g, v);
  // Small clock tower on the roof
  box(ctx, g.sx + g.dx * 0.5 - 9, g.T - g.dy * 0.5 + 2, 18, 22, 10, v.wallColor);
  const tx = g.sx + g.dx * 0.5;
  const ty = g.T - g.dy * 0.5 - 20;
  polygonPath(ctx, [
    [tx - 12, ty],
    [tx + 1, ty - 14],
    [tx + 14, ty - 3],
  ]);
  fillStroke(ctx, "#2f6e5e", 1.3);
  ctx.beginPath();
  ctx.arc(tx, ty + 9, 4, 0, Math.PI * 2);
  fillStroke(ctx, "#fffdf5", 1.1);

  flagPole(ctx, g.L - 12, g.base, g.H + 20, time);
}

function drawOffice(ctx: CanvasRenderingContext2D, g: Geo, v: BuildingVisual, label: string): void {
  const floors = v.floors;
  const lobbyH = 30;
  const upperH = g.H - lobbyH - 16;
  const floorH = upperH / floors;
  const cols = Math.max(3, Math.floor(g.W / 22));
  const cellW = (g.W - 12) / cols;

  // Name band
  ctx.beginPath();
  ctx.rect(g.L + 5, g.T + 4, g.W - 10, 10);
  fillStroke(ctx, v.trimColor, 1);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), g.sx, g.T + 9.5);

  // Glass curtain wall
  for (let f = 0; f < floors; f++) {
    const y = g.T + 16 + f * floorH;
    for (let c = 0; c < cols; c++) {
      const x = g.L + 6 + c * cellW;
      glassCell(ctx, x + 1, y + 1.5, cellW - 2, floorH - 4, v.windowColor);
    }
  }
  // Pilasters
  ctx.fillStyle = shade(v.wallColor, -12);
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(g.L + 5 + c * cellW, g.T + 15, 2, upperH + 1);
  }

  // Lobby
  const ly = g.base - lobbyH;
  ctx.beginPath();
  ctx.rect(g.L + 6, ly, g.W - 12, lobbyH - 6);
  fillStroke(ctx, shade(v.windowColor, -40), 1.2);
  for (let i = 1; i < 4; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(g.L + 6 + (i * (g.W - 12)) / 4 - 1, ly, 2, lobbyH - 6);
  }
  door(ctx, g.sx, g.base - 6, 22, 20, shade(v.windowColor, -20), true);
  // Canopy
  polygonPath(ctx, [
    [g.sx - 22, ly - 2],
    [g.sx + 22, ly - 2],
    [g.sx + 26, ly + 4],
    [g.sx - 26, ly + 4],
  ]);
  fillStroke(ctx, v.trimColor, 1.2);

  onSide(ctx, g, () => {
    const sCols = 3;
    const sw = (g.D - 8) / sCols;
    for (let f = 0; f < floors; f++) {
      const y = -g.H + 16 + f * floorH;
      for (let c = 0; c < sCols; c++) {
        glassCell(ctx, 4 + c * sw + 1, y + 1.5, sw - 2, floorH - 4, shade(v.windowColor, -35));
      }
    }
  });

  flatRoof(ctx, g, v);
  // Rooftop AC units + antenna
  box(ctx, g.L + 12 + g.dx * 0.3, g.T - g.dy * 0.3 + 1, 16, 8, 10, "#cbd5e1");
  box(ctx, g.L + 38 + g.dx * 0.55, g.T - g.dy * 0.55 + 1, 12, 7, 8, "#cbd5e1");
  const ax = g.R - 10 + g.dx * 0.6;
  const ay = g.T - g.dy * 0.6;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax, ay - 20);
  ctx.stroke();
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(ax, ay - 21, 2, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- parts ---------- */

function gableRoof(ctx: CanvasRenderingContext2D, g: Geo, v: BuildingVisual): void {
  const o = 7;
  const apex: Pt = [g.sx, g.T - v.roofHeight];
  const eL: Pt = [g.L - o, g.T + 3];
  const eR: Pt = [g.R + o, g.T + 3];
  const back = (p: Pt): Pt => [p[0] + g.dx, p[1] - g.dy];

  // Left slope (seen from above)
  polygonPath(ctx, [apex, back(apex), back(eL), eL]);
  fillStroke(ctx, shade(v.roofColor, -22));

  // Right slope with tile rows
  polygonPath(ctx, [apex, eR, back(eR), back(apex)]);
  fillStroke(ctx, v.roofColor);
  ctx.strokeStyle = shade(v.roofColor, -38);
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const p = lerp(apex, eR, i / 6);
    const q = back(p);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }
  ctx.strokeStyle = shade(v.roofColor, -18);
  ctx.lineWidth = 0.8;
  for (let j = 1; j < 5; j++) {
    const a = lerp(apex, back(apex), j / 5);
    const b = lerp(eR, back(eR), j / 5);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  // Front gable wall
  polygonPath(ctx, [
    [g.L, g.T],
    [apex[0], apex[1] + 4],
    [g.R, g.T],
  ]);
  fillStroke(ctx, shade(v.wallColor, 6));

  // Fascia boards along the front edge
  ctx.lineCap = "round";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(eL[0], eL[1]);
  ctx.lineTo(apex[0], apex[1]);
  ctx.lineTo(eR[0], eR[1]);
  ctx.stroke();
  ctx.strokeStyle = shade(v.roofColor, -30);
  ctx.lineWidth = 4.4;
  ctx.stroke();
}

function flatRoof(ctx: CanvasRenderingContext2D, g: Geo, v: BuildingVisual): void {
  const top: Pt[] = [
    [g.L - 2, g.T],
    [g.R + 2, g.T],
    [g.R + 2 + g.dx, g.T - g.dy],
    [g.L - 2 + g.dx, g.T - g.dy],
  ];
  polygonPath(ctx, top);
  fillStroke(ctx, v.roofColor);
  polygonPath(ctx, [
    [g.L + 4, g.T - 2],
    [g.R - 2, g.T - 2],
    [g.R - 2 + g.dx * 0.86, g.T - g.dy * 0.86],
    [g.L + 4 + g.dx * 0.86, g.T - g.dy * 0.86],
  ]);
  fillStroke(ctx, shade(v.roofColor, -18), 1);
  ctx.beginPath();
  ctx.rect(g.L - 2, g.T - 2, g.W + 4, 4);
  fillStroke(ctx, shade(v.roofColor, 18), 1.2);
}

/** Small oblique box; (x, y) is the bottom-left of its front face */
function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  d: number,
  color: string,
): void {
  const dx = d * OBLIQUE.x;
  const dy = d * OBLIQUE.y;
  polygonPath(ctx, [
    [x + w, y],
    [x + w + dx, y - dy],
    [x + w + dx, y - h - dy],
    [x + w, y - h],
  ]);
  fillStroke(ctx, shade(color, -35), 1.2);
  polygonPath(ctx, [
    [x, y - h],
    [x + w, y - h],
    [x + w + dx, y - h - dy],
    [x + dx, y - h - dy],
  ]);
  fillStroke(ctx, shade(color, 18), 1.2);
  ctx.beginPath();
  ctx.rect(x, y - h, w, h);
  fillStroke(ctx, color, 1.2);
}

function onSide(ctx: CanvasRenderingContext2D, g: Geo, draw: () => void): void {
  ctx.save();
  ctx.translate(g.R, g.base);
  ctx.transform(g.dx / g.D, -g.dy / g.D, 0, 1, 0, 0);
  draw();
  ctx.restore();
}

function windowFront(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glass: string,
  frame: string,
  shutter?: string,
): void {
  if (shutter) {
    for (const sx of [x - 6, x + w + 1]) {
      roundRectPath(ctx, sx, y - 1, 5, h + 2, 1);
      fillStroke(ctx, shutter, 1);
    }
  }
  windowRaw(ctx, x, y, w, h, glass, frame);
  // Sill
  ctx.beginPath();
  ctx.rect(x - 2.5, y + h + 1, w + 5, 2.5);
  fillStroke(ctx, "#f1ece2", 0.9);
}

function windowRaw(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glass: string,
  frame: string,
): void {
  roundRectPath(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 1.5);
  fillStroke(ctx, frame, 1);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, shade(glass, 25));
  grad.addColorStop(1, shade(glass, -25));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // Reflection
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.55);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x + w * 0.65, y);
  ctx.lineTo(x, y + h * 0.85);
  ctx.closePath();
  ctx.fill();
  crossLines(ctx, x, y, w, h, frame);
}

function crossLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x + w / 2 - 0.8, y, 1.6, h);
  ctx.fillRect(x, y + h / 2 - 0.8, w, 1.6);
}

function glassCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glass: string,
): void {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, shade(glass, 35));
  grad.addColorStop(1, shade(glass, -30));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.6);
  ctx.lineTo(x + w * 0.6, y);
  ctx.lineTo(x + w * 0.85, y);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

function door(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  w: number,
  h: number,
  color: string,
  double = false,
): void {
  ctx.beginPath();
  ctx.rect(cx - w / 2 - 4, base - 3, w + 8, 3);
  fillStroke(ctx, "#b9b0a2", 1);
  roundRectPath(ctx, cx - w / 2 - 2, base - h - 5, w + 4, h + 2, 2);
  fillStroke(ctx, shade(color, -25), 1.2);
  ctx.beginPath();
  ctx.rect(cx - w / 2, base - h - 3, w, h);
  fillStroke(ctx, color, 1.2);
  ctx.strokeStyle = shade(color, -35);
  ctx.lineWidth = 1;
  if (double) {
    ctx.beginPath();
    ctx.moveTo(cx, base - h - 3);
    ctx.lineTo(cx, base - 3);
    ctx.stroke();
  }
  const panels = double ? [cx - w / 2 + 2, cx + 2] : [cx - w / 2 + 2];
  const pw = double ? w / 2 - 4 : w - 4;
  for (const px of panels) {
    ctx.strokeRect(px, base - h, pw, h * 0.38);
    ctx.strokeRect(px, base - h * 0.55, pw, h * 0.42);
  }
  ctx.fillStyle = "#f2c94c";
  ctx.beginPath();
  ctx.arc(double ? cx - 2.5 : cx + w / 2 - 4, base - h / 2 - 2, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

function flagPole(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, time: number): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x, base - h);
  ctx.stroke();
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  const top = base - h + 2;
  const wave = (t: number) => Math.sin(time * 0.006 + t * 3) * 1.6;
  const fw = 20;
  for (const [color, oy] of [
    ["#dc2626", 0],
    ["#ffffff", 6],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + 1, top + oy);
    for (let i = 1; i <= 4; i++) ctx.lineTo(x + 1 + (fw * i) / 4, top + oy + wave(i / 4));
    for (let i = 4; i >= 0; i--) ctx.lineTo(x + 1 + (fw * i) / 4, top + oy + 6 + wave(i / 4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, top, fw, 12);
}

/** Wooden name board: bold short label on top, institution name lines below */
function drawSign(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  label: string,
  lines: string[],
): void {
  const labelFont = "800 10px ui-sans-serif, system-ui, sans-serif";
  const nameFont = "600 9px ui-sans-serif, system-ui, sans-serif";
  const lineH = 11;
  ctx.font = labelFont;
  let textW = ctx.measureText(label).width;
  ctx.font = nameFont;
  for (const line of lines) textW = Math.max(textW, ctx.measureText(line).width);
  const tw = Math.max(36, textW + 12);
  const th = 6 + lineH * (1 + lines.length);
  const x = cx - tw / 2;

  // Posts
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(x + 5, top + th - 2, 3, 6);
  ctx.fillRect(x + tw - 8, top + th - 2, 3, 6);

  roundRectPath(ctx, x, top, tw, th, 3);
  fillStroke(ctx, "#fff6e0", 2, "#6b4226");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3b2a1a";
  ctx.font = labelFont;
  ctx.fillText(label, cx, top + 3 + lineH / 2 + 0.5);
  if (lines.length) {
    ctx.fillStyle = "rgba(107, 66, 38, 0.35)";
    ctx.fillRect(x + 6, top + 3 + lineH, tw - 12, 1);
    ctx.fillStyle = "#6b4226";
    ctx.font = nameFont;
    lines.forEach((line, i) => {
      ctx.fillText(line, cx, top + 3 + lineH * (i + 1) + lineH / 2 + 1);
    });
  }
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
