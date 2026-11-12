import {
  ROAD_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  bridge,
  pond,
  road,
  type DecorItem,
} from "@/data/worldData";
import { OUTLINE, fillStroke, groundShadow, roundRectPath } from "./shapes";
import type { WorldRenderContext } from "./types";

let patterns: { asphalt: CanvasPattern; curb: CanvasPattern; grass: CanvasPattern } | null = null;

function makePattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  draw: (p: CanvasRenderingContext2D) => void,
): CanvasPattern {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const p = c.getContext("2d")!;
  draw(p);
  return ctx.createPattern(c, "repeat")!;
}

function getPatterns(ctx: CanvasRenderingContext2D) {
  if (patterns) return patterns;

  const asphalt = makePattern(ctx, 64, 64, (p) => {
    p.fillStyle = "#4a4f59";
    p.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 260; i++) {
      const v = Math.random();
      p.fillStyle = v < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.12)";
      p.fillRect(Math.random() * 64, Math.random() * 64, 1.5, 1.5);
    }
  });

  // Cut-stone curb blocks
  const curb = makePattern(ctx, 24, 12, (p) => {
    p.fillStyle = "#6f6a62";
    p.fillRect(0, 0, 24, 12);
    const stones: [number, number, number, number, string][] = [
      [1, 1, 10, 4, "#b7b0a3"],
      [12, 1, 11, 4, "#a59e91"],
      [-5, 7, 10, 4, "#a59e91"],
      [6, 7, 11, 4, "#c2bbae"],
      [18, 7, 10, 4, "#b7b0a3"],
    ];
    for (const [x, y, w, h, c] of stones) {
      p.fillStyle = c;
      p.fillRect(x, y, w, h);
    }
  });

  const grass = makePattern(ctx, 96, 96, (p) => {
    p.fillStyle = "#74bf55";
    p.fillRect(0, 0, 96, 96);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 96;
      p.fillStyle = ["#6ab44c", "#82ca60", "#64ad47"][i % 3];
      p.fillRect(x, y, 6 + Math.random() * 6, 4 + Math.random() * 3);
    }
    p.strokeStyle = "#4f9a3a";
    p.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * 96;
      const y = Math.random() * 96;
      p.beginPath();
      p.moveTo(x, y);
      p.lineTo(x - 1.5, y - 5);
      p.moveTo(x + 2, y);
      p.lineTo(x + 3, y - 6);
      p.stroke();
    }
  });

  patterns = { asphalt, curb, grass };
  return patterns;
}

function anchor(pattern: CanvasPattern, cameraX: number, cameraY: number): CanvasPattern {
  pattern.setTransform(new DOMMatrix([1, 0, 0, 1, -cameraX, -cameraY]));
  return pattern;
}

export function drawWorldGround(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY, viewW, viewH, time } = w;
  const pat = getPatterns(ctx);

  // Dense forest outside the map
  ctx.fillStyle = "#2f6a35";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.fillStyle = anchor(pat.grass, cameraX, cameraY);
  ctx.fillRect(-cameraX, -cameraY, WORLD_WIDTH, WORLD_HEIGHT);

  drawHedgeBorder(w);
  drawPond(w, time);
  drawRoad(w);
  drawBridgeDeck(w);
}

function drawHedgeBorder(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY } = w;
  const step = 26;
  const hedge = (x: number, y: number) => {
    const sx = x - cameraX;
    const sy = y - cameraY;
    if (sx < -30 || sy < -30 || sx > w.viewW + 30 || sy > w.viewH + 30) return;
    ctx.beginPath();
    ctx.arc(sx, sy, 17, 0, Math.PI * 2);
    fillStroke(ctx, "#3f8f45", 1.6, "#24572a");
    ctx.beginPath();
    ctx.arc(sx - 4, sy - 5, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#56ab5a";
    ctx.fill();
  };
  for (let x = 0; x <= WORLD_WIDTH; x += step) {
    hedge(x, 4);
    hedge(x, WORLD_HEIGHT - 2);
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += step) {
    hedge(2, y);
    hedge(WORLD_WIDTH - 2, y);
  }
}

function roadPath(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
  ctx.beginPath();
  ctx.moveTo(road[0].x - cameraX, road[0].y - cameraY);
  for (let i = 1; i < road.length; i++) ctx.lineTo(road[i].x - cameraX, road[i].y - cameraY);
}

function drawRoad(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY } = w;
  const pat = getPatterns(ctx);

  ctx.save();
  ctx.lineJoin = "miter";
  ctx.miterLimit = 6;
  ctx.lineCap = "butt";

  roadPath(ctx, cameraX, cameraY);

  // Outline + stone curb
  ctx.strokeStyle = "#3c3833";
  ctx.lineWidth = ROAD_WIDTH + 14;
  ctx.stroke();
  ctx.strokeStyle = anchor(pat.curb, cameraX, cameraY);
  ctx.lineWidth = ROAD_WIDTH + 11;
  ctx.stroke();

  // Asphalt with white edge lines
  ctx.strokeStyle = anchor(pat.asphalt, cameraX, cameraY);
  ctx.lineWidth = ROAD_WIDTH;
  ctx.stroke();
  ctx.strokeStyle = "rgba(245,245,240,0.85)";
  ctx.lineWidth = ROAD_WIDTH - 6;
  ctx.stroke();
  ctx.strokeStyle = anchor(pat.asphalt, cameraX, cameraY);
  ctx.lineWidth = ROAD_WIDTH - 9;
  ctx.stroke();

  // Center dashes
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = "#f3c94a";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Rounded plazas at both ends so the road doesn't stop abruptly
  for (const p of [road[0], road[road.length - 1]]) {
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y - cameraY, ROAD_WIDTH / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = anchor(pat.curb, cameraX, cameraY);
    ctx.fill();
    ctx.strokeStyle = "#3c3833";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawPond(w: WorldRenderContext, time: number): void {
  const { ctx, cameraX, cameraY } = w;
  const cx = pond.x - cameraX;
  const cy = pond.y - cameraY;

  // Stone bank
  ctx.beginPath();
  ctx.ellipse(cx, cy, pond.rx + 12, pond.ry + 10, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#a69c8a", 2, "#5c554a");
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const rx = (pond.rx + 7) * Math.cos(a);
    const ry = (pond.ry + 6) * Math.sin(a);
    ctx.beginPath();
    ctx.ellipse(cx + rx, cy + ry, 6, 4, a, 0, Math.PI * 2);
    fillStroke(ctx, i % 2 ? "#c9c0ae" : "#b8ae9b", 1, "#6b6356");
  }

  // Water
  const water = ctx.createRadialGradient(cx - 14, cy - 12, 6, cx, cy, pond.rx);
  water.addColorStop(0, "#8fe0fa");
  water.addColorStop(0.5, "#3fb3e6");
  water.addColorStop(1, "#1679b5");
  ctx.beginPath();
  ctx.ellipse(cx, cy, pond.rx, pond.ry, 0, 0, Math.PI * 2);
  fillStroke(ctx, water, 2, "#0e5c8c");

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, pond.rx, pond.ry, 0, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const phase = (time * 0.0009 + i * 0.2) % 1;
    const rx = 6 + phase * 14;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.ellipse(cx - 40 + i * 20, cy + ((i % 2) * 2 - 1) * 26, rx, rx * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Koi swimming in loops
  const koi: [number, number, number, string][] = [
    [0, 30, 20, "#f97316"],
    [2.1, 44, 34, "#fafafa"],
    [4.2, 56, 28, "#ef4444"],
    [1.2, 22, 38, "#fbbf24"],
  ];
  for (const [off, rx, ry, color] of koi) {
    const t = time * 0.0006 + off;
    const fx = cx + Math.cos(t) * rx;
    const fy = cy + Math.sin(t) * ry;
    drawKoi(ctx, fx, fy, t + Math.PI / 2, color);
  }

  // Lily pads
  for (const [lx, ly, r] of [
    [-52, -22, 9],
    [48, 20, 8],
    [-30, 32, 7],
    [58, -26, 9],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx + lx, cy + ly);
    ctx.arc(cx + lx, cy + ly, r, 0.3, Math.PI * 2 - 0.1);
    ctx.closePath();
    fillStroke(ctx, "#4caf50", 1, "#1f6b2a");
  }
  ctx.fillStyle = "#f9a8d4";
  ctx.beginPath();
  ctx.arc(cx + 58, cy - 26, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Reeds on the bank
  ctx.strokeStyle = "#3f7f2e";
  ctx.lineWidth = 2;
  for (const [rx, ry] of [
    [-pond.rx - 4, -6],
    [-pond.rx + 2, 10],
    [pond.rx + 2, 8],
    [pond.rx - 6, -18],
  ] as const) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + rx + i * 3, cy + ry);
      ctx.lineTo(cx + rx + i * 3 + (i - 1) * 2, cy + ry - 14 - i * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#7c4a24";
    ctx.fillRect(cx + rx + 2, cy + ry - 18, 2.5, 6);
  }
}

function drawKoi(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(10,60,90,0.25)";
  ctx.beginPath();
  ctx.ellipse(2, 3, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-12, 4);
  ctx.closePath();
  ctx.fill();
  if (color === "#fafafa") {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(2, -0.5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBridgeDeck(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY } = w;
  const bx = bridge.x - cameraX;
  const by = bridge.y - cameraY;
  const bw = bridge.width;
  const bh = bridge.deckHeight;
  const left = bx - bw / 2;
  const top = by - bh / 2;

  // Shadow on water
  ctx.fillStyle = "rgba(8, 40, 70, 0.3)";
  ctx.fillRect(left + 8, top + bh, bw - 16, 8);

  // Support pillars visible under the deck
  for (const px of [left + 40, bx, left + bw - 40]) {
    ctx.beginPath();
    ctx.rect(px - 4, top + bh - 2, 8, 9);
    fillStroke(ctx, "#5b3a22", 1.2);
  }

  // Deck planks (perpendicular to travel direction)
  ctx.beginPath();
  ctx.rect(left, top, bw, bh);
  fillStroke(ctx, "#b98552", 2);
  const plank = 9;
  for (let x = left; x < left + bw; x += plank) {
    ctx.fillStyle = Math.round((x - left) / plank) % 2 ? "#c79563" : "#b07a48";
    ctx.fillRect(x + 0.5, top + 1, plank - 1, bh - 2);
    ctx.fillStyle = "rgba(60,30,10,0.35)";
    ctx.fillRect(x + plank / 2 - 0.5, top + 4, 1, 1.5);
    ctx.fillRect(x + plank / 2 - 0.5, top + bh - 6, 1, 1.5);
  }
  // Edge beams
  ctx.fillStyle = "#7a4a26";
  ctx.fillRect(left, top, bw, 4);
  ctx.fillRect(left, top + bh - 4, bw, 4);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left, top, bw, bh);

  // Back railing (the front railing is drawn above characters)
  drawRailing(ctx, left, top + 2, bw);
}

/** Front railing — drawn after characters standing on the bridge */
export function drawBridgeFrontRail(w: WorldRenderContext): void {
  const bx = bridge.x - w.cameraX;
  const by = bridge.y - w.cameraY;
  drawRailing(w.ctx, bx - bridge.width / 2, by + bridge.deckHeight / 2 - 1, bridge.width);
}

export const BRIDGE_RAIL_SORT_Y = bridge.y + bridge.deckHeight / 2;

function drawRailing(ctx: CanvasRenderingContext2D, left: number, y: number, width: number): void {
  const postH = 14;
  const posts = 9;
  for (let i = 0; i < posts; i++) {
    const px = left + 3 + (i * (width - 6)) / (posts - 1);
    roundRectPath(ctx, px - 2.5, y - postH, 5, postH + 2, 1);
    fillStroke(ctx, "#6b3f20", 1.2);
  }
  roundRectPath(ctx, left - 2, y - postH - 2, width + 4, 5, 2);
  fillStroke(ctx, "#8b5a2b", 1.4);
  roundRectPath(ctx, left, y - postH / 2, width, 3, 1.5);
  fillStroke(ctx, "#7a4a26", 1);
}

/* ---------- decor ---------- */

export function drawDecor(w: WorldRenderContext, item: DecorItem): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = item.x - cameraX;
  const y = item.y - cameraY;
  if (x < -70 || y < -110 || x > w.viewW + 70 || y > w.viewH + 40) return;

  switch (item.kind) {
    case "tree":
      drawTree(ctx, x, y, time);
      break;
    case "pine":
      drawPine(ctx, x, y);
      break;
    case "bush":
      drawBush(ctx, x, y);
      break;
    case "rock":
      drawRock(ctx, x, y);
      break;
    case "flowers":
      drawFlowers(ctx, x, y);
      break;
    case "lamp":
      drawLamp(ctx, x, y, time);
      break;
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const sway = Math.sin(time * 0.0015 + x * 0.1) * 1.5;
  groundShadow(ctx, x + 4, y + 2, 24, 9, 0.22);
  roundRectPath(ctx, x - 5, y - 30, 10, 32, 3);
  fillStroke(ctx, "#8b5a2b");
  const blobs: [number, number, number, string][] = [
    [-14, -40, 17, "#3c8f3f"],
    [14, -40, 17, "#3c8f3f"],
    [0, -56, 22, "#46a24a"],
    [-8, -64, 13, "#5cbc5c"],
    [9, -50, 12, "#5cbc5c"],
  ];
  for (const [dx, dy, r, c] of blobs) {
    ctx.beginPath();
    ctx.arc(x + dx + sway, y + dy, r, 0, Math.PI * 2);
    fillStroke(ctx, c, 2, "#25602a");
  }
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(x - 6 + sway, y - 66, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPine(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x + 3, y + 2, 18, 7, 0.22);
  ctx.beginPath();
  ctx.rect(x - 4, y - 14, 8, 16);
  fillStroke(ctx, "#7a4a26");
  const tiers: [number, number, string][] = [
    [-12, 22, "#2f7a3e"],
    [-30, 18, "#378a46"],
    [-46, 13, "#43a052"],
  ];
  for (const [ty, hw, c] of tiers) {
    ctx.beginPath();
    ctx.moveTo(x - hw, y + ty);
    ctx.lineTo(x, y + ty - 26);
    ctx.lineTo(x + hw, y + ty);
    ctx.closePath();
    fillStroke(ctx, c, 2, "#1f5a2b");
  }
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 3, 18, 6, 0.18);
  for (const [dx, dy, r] of [
    [-9, -6, 10],
    [8, -7, 11],
    [0, -12, 10],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    fillStroke(ctx, "#4caf50", 1.8, "#22602b");
  }
  ctx.fillStyle = "#e11d48";
  for (const [dx, dy] of [
    [-8, -9],
    [6, -12],
    [10, -4],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x + 2, y + 2, 15, 5, 0.2);
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x - 10, y - 10);
  ctx.lineTo(x + 2, y - 14);
  ctx.lineTo(x + 13, y - 7);
  ctx.lineTo(x + 14, y);
  ctx.closePath();
  fillStroke(ctx, "#9ca3af", 1.6, "#4b5563");
  ctx.fillStyle = "#cbd2da";
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 9);
  ctx.lineTo(x + 1, y - 12);
  ctx.lineTo(x - 2, y - 6);
  ctx.closePath();
  ctx.fill();
}

function drawFlowers(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const colors = ["#f472b6", "#fbbf24", "#60a5fa", "#fb7185", "#ffffff"];
  for (let i = 0; i < 6; i++) {
    const fx = x + ((i * 37) % 26) - 13;
    const fy = y + ((i * 23) % 10) - 5;
    ctx.strokeStyle = "#3f8f3a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - 7);
    ctx.stroke();
    ctx.fillStyle = colors[i % colors.length];
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * 2, fy - 9 + Math.sin(a) * 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(fx, fy - 9, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  groundShadow(ctx, x, y + 1, 7, 3, 0.2);
  ctx.beginPath();
  ctx.rect(x - 1.8, y - 38, 3.6, 38);
  fillStroke(ctx, "#374151", 1.2);
  roundRectPath(ctx, x - 5, y - 4, 10, 5, 1.5);
  fillStroke(ctx, "#374151", 1.2);
  const glow = 0.25 + Math.sin(time * 0.003) * 0.05;
  ctx.fillStyle = `rgba(255, 230, 140, ${glow})`;
  ctx.beginPath();
  ctx.arc(x, y - 44, 13, 0, Math.PI * 2);
  ctx.fill();
  roundRectPath(ctx, x - 5, y - 50, 10, 12, 2);
  fillStroke(ctx, "#fde68a", 1.4);
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 50);
  ctx.lineTo(x, y - 55);
  ctx.lineTo(x + 7, y - 50);
  ctx.closePath();
  fillStroke(ctx, "#374151", 1.2);
}

export function drawFloatingIcon(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
): void {
  const y = screenY + Math.sin(time * 0.004) * 4;
  roundRectPath(ctx, screenX - 13, y - 26, 26, 22, 7);
  fillStroke(ctx, "#fff8e7", 2.5, "#5b3a29");
  ctx.beginPath();
  ctx.moveTo(screenX - 5, y - 5);
  ctx.lineTo(screenX, y + 4);
  ctx.lineTo(screenX + 5, y - 5);
  ctx.fillStyle = "#fff8e7";
  ctx.fill();
  ctx.strokeStyle = "#5b3a29";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(screenX, y - 15, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", screenX, y - 14.5);
}
