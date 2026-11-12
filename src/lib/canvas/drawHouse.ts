import {
  HOUSE_HEIGHT,
  HOUSE_ROOMS,
  HOUSE_WALLS,
  HOUSE_WIDTH,
  type CatData,
  type HouseDialogueItem,
} from "@/data/houseData";
import { drawSpeechBubble } from "./drawSpeechBubble";
import { OUTLINE, fillStroke, groundShadow, roundRectPath } from "./shapes";
import type { WorldRenderContext } from "./types";

export interface CatRuntimeState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  waitTimer: number;
  facing: "left" | "right";
  moving: boolean;
  greeted: boolean;
}

export function drawHouseGround(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY, viewW, viewH } = w;

  // Cozy dark backdrop outside the house walls
  ctx.fillStyle = "#1d1612";
  ctx.fillRect(0, 0, viewW, viewH);

  // Outer house shell shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(24 - cameraX, 16 - cameraY, HOUSE_WIDTH - 48, HOUSE_HEIGHT - 24);

  // Draw each room's flooring
  for (const r of HOUSE_ROOMS) {
    const rx = r.x - cameraX;
    const ry = r.y - cameraY;
    drawRoomFloor(ctx, rx, ry, r.w, r.h, r.floor);
  }

  // Fill doorway gaps with wood / tile transition
  ctx.fillStyle = "#c99868";
  ctx.fillRect(444 - cameraX, 185 - cameraY, 18, 60);
  ctx.fillRect(195 - cameraX, 310 - cameraY, 70, 20);
  ctx.fillRect(600 - cameraX, 310 - cameraY, 70, 20);
  ctx.fillRect(578 - cameraX, 440 - cameraY, 18, 75);

  // Decorative rugs
  // Living room central rug
  drawRug(ctx, 295 - cameraX, 465 - cameraY, 210, 110, "#9e3b33", "#e6c280");
  // Bedroom rug
  drawRug(ctx, 225 - cameraX, 215 - cameraY, 130, 74, "#3b6e8c", "#bae6fd");
  // Hobby room rug
  drawRug(ctx, 645 - cameraX, 205 - cameraY, 155, 82, "#4c6b47", "#bbf7d0");

  // Cat food & water bowls in the kitchen corner
  drawCatBowls(ctx, 632 - cameraX, 368 - cameraY);

  // Walls
  for (const wall of HOUSE_WALLS) {
    const wx = wall.x - cameraX;
    const wy = wall.y - cameraY;
    // Wall top & face
    ctx.fillStyle = "#f4ead5";
    ctx.fillRect(wx, wy, wall.w, wall.h);
    ctx.fillStyle = "#8c5834";
    ctx.fillRect(wx, wy, wall.w, 6);
    ctx.fillStyle = "#b57c4e";
    ctx.fillRect(wx, wy + wall.h - 4, wall.w, 4);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(wx, wy, wall.w, wall.h);
  }

  // Room labels subtly on top wall / divider
  ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const r of HOUSE_ROOMS) {
    const lx = r.x + 12 - cameraX;
    const ly = r.y + 12 - cameraY;
    const tw = ctx.measureText(r.label).width + 12;
    roundRectPath(ctx, lx - 5, ly - 8, tw, 16, 4);
    ctx.fillStyle = "rgba(59, 42, 26, 0.72)";
    ctx.fill();
    ctx.fillStyle = "#fff8e7";
    ctx.fillText(r.label, lx + 1, ly + 0.5);
  }
}

function drawRoomFloor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: "wood" | "warm_wood" | "tile" | "rug_room",
): void {
  if (kind === "tile") {
    ctx.fillStyle = "#efe6d5";
    ctx.fillRect(x, y, w, h);
    const sz = 26;
    for (let ty = 0; ty < h; ty += sz) {
      for (let tx = 0; tx < w; tx += sz) {
        const alt = (Math.floor(tx / sz) + Math.floor(ty / sz)) % 2 === 0;
        ctx.fillStyle = alt ? "#e5dac5" : "#f5ede0";
        ctx.fillRect(x + tx, y + ty, Math.min(sz, w - tx), Math.min(sz, h - ty));
      }
    }
    ctx.strokeStyle = "rgba(120, 95, 70, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    return;
  }

  const base = kind === "wood" ? "#c89664" : kind === "warm_wood" ? "#be8756" : "#d1a06e";
  const plankAlt = kind === "wood" ? "#bd8a58" : kind === "warm_wood" ? "#b27b4b" : "#c69362";
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);

  const plankH = 18;
  ctx.strokeStyle = "rgba(85, 50, 25, 0.22)";
  ctx.lineWidth = 1;
  for (let py = 0; py < h; py += plankH) {
    if (Math.floor(py / plankH) % 2 === 1) {
      ctx.fillStyle = plankAlt;
      ctx.fillRect(x, y + py, w, Math.min(plankH, h - py));
    }
    ctx.beginPath();
    ctx.moveTo(x, y + py);
    ctx.lineTo(x + w, y + py);
    ctx.stroke();
  }
}

function drawRug(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  mainColor: string,
  trimColor: string,
): void {
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, 8);
  fillStroke(ctx, mainColor, 1.8, "#3b2316");
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12);
}

function drawCatBowls(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  roundRectPath(ctx, x - 20, y - 8, 42, 16, 4);
  fillStroke(ctx, "#d97706", 1.2);
  // Water bowl
  ctx.beginPath();
  ctx.arc(x - 9, y, 6, 0, Math.PI * 2);
  fillStroke(ctx, "#38bdf8", 1.2);
  // Food bowl
  ctx.beginPath();
  ctx.arc(x + 10, y, 6, 0, Math.PI * 2);
  fillStroke(ctx, "#78350f", 1.2);
}

export function drawFurnitureItem(
  w: WorldRenderContext,
  item: HouseDialogueItem,
  highlight: boolean,
): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = item.x - cameraX;
  const y = item.y - cameraY;

  if (highlight) {
    const pulse = 0.65 + Math.sin(time * 0.007) * 0.3;
    ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(x, y - item.height * 0.25, item.width * 0.56, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  switch (item.kind) {
    case "pc_desk":
      drawPcDesk(ctx, x, y, time);
      break;
    case "bookshelf":
      drawBookshelf(ctx, x, y);
      break;
    case "corkboard":
      drawCorkboard(ctx, x, y);
      break;
    case "bed":
      drawBed(ctx, x, y);
      break;
    case "console_tv":
      drawConsoleTv(ctx, x, y, time);
      break;
    case "guitar":
      drawGuitarCorner(ctx, x, y);
      break;
    case "photo_wall":
      drawPhotoWall(ctx, x, y);
      break;
    case "sports_rack":
      drawSportsRack(ctx, x, y);
      break;
    case "family_frame":
      drawFamilyFrame(ctx, x, y);
      break;
    case "sofa_table":
      drawSofaTable(ctx, x, y);
      break;
    case "trophy_case":
      drawTrophyCase(ctx, x, y);
      break;
    case "phone_table":
      drawPhoneTable(ctx, x, y);
      break;
    case "plant":
      drawHousePlant(ctx, x, y);
      break;
    case "kitchen_counter":
      drawKitchenCounter(ctx, x, y);
      break;
    case "fridge":
      drawFridge(ctx, x, y);
      break;
    case "dining_table":
      drawDiningTable(ctx, x, y);
      break;
    case "doormat":
      drawDoormat(ctx, x, y, time);
      break;
  }

  // Subtle sparkle badge on interactive items (except doormat)
  if (!item.isExit) {
    const bob = Math.sin(time * 0.004 + item.x * 0.03) * 2.5;
    const sy = y - item.height - 10 + bob;
    ctx.fillStyle = highlight ? "#fde047" : "rgba(255, 248, 220, 0.82)";
    ctx.beginPath();
    ctx.arc(x, sy, highlight ? 5.5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5b3a29";
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
}

function drawPcDesk(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  groundShadow(ctx, x, y + 2, 54, 10, 0.22);
  // Desk top & legs
  roundRectPath(ctx, x - 52, y - 34, 104, 24, 3);
  fillStroke(ctx, "#8b5a2b", 1.8);
  ctx.fillStyle = "#5c3a1b";
  ctx.fillRect(x - 48, y - 10, 8, 12);
  ctx.fillRect(x + 40, y - 10, 8, 12);
  // Dual monitors
  roundRectPath(ctx, x - 40, y - 58, 36, 22, 2);
  fillStroke(ctx, "#1e293b", 1.6);
  roundRectPath(ctx, x + 2, y - 58, 36, 22, 2);
  fillStroke(ctx, "#1e293b", 1.6);
  // Screen code glow
  const glow = Math.sin(time * 0.005) > 0 ? "#38bdf8" : "#4ade80";
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x - 37, y - 55, 30, 16);
  ctx.fillRect(x + 5, y - 55, 30, 16);
  ctx.fillStyle = glow;
  ctx.fillRect(x - 34, y - 52, 18, 2);
  ctx.fillRect(x - 34, y - 48, 24, 2);
  ctx.fillRect(x - 34, y - 44, 14, 2);
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(x + 8, y - 52, 20, 2);
  ctx.fillRect(x + 8, y - 47, 15, 2);
  // Keyboard & coffee mug
  roundRectPath(ctx, x - 16, y - 24, 28, 7, 1.5);
  fillStroke(ctx, "#cbd5e1", 1);
  roundRectPath(ctx, x + 26, y - 27, 8, 9, 2);
  fillStroke(ctx, "#f97316", 1.2);
}

function drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 38, 8, 0.22);
  roundRectPath(ctx, x - 36, y - 58, 72, 58, 3);
  fillStroke(ctx, "#7c4a24", 1.8);
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];
  for (let row = 0; row < 3; row++) {
    const sy = y - 52 + row * 17;
    ctx.fillStyle = "#4a2c14";
    ctx.fillRect(x - 32, sy, 64, 13);
    for (let b = 0; b < 8; b++) {
      ctx.fillStyle = colors[(row * 3 + b) % colors.length];
      ctx.fillRect(x - 30 + b * 7.5, sy + 2, 6, 11);
    }
  }
}

function drawCorkboard(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  roundRectPath(ctx, x - 28, y - 48, 56, 36, 3);
  fillStroke(ctx, "#d99b52", 1.8, "#5c3a1b");
  const notes: [number, number, string][] = [
    [-18, -42, "#fde047"],
    [-2, -40, "#93c5fd"],
    [12, -43, "#fda4af"],
    [-12, -26, "#86efac"],
    [8, -27, "#fde047"],
  ];
  for (const [nx, ny, c] of notes) {
    ctx.fillStyle = c;
    ctx.fillRect(x + nx, y + ny, 11, 10);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x + nx + 4, y + ny + 1, 2, 2);
  }
}

function drawBed(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 3, 42, 12, 0.24);
  // Headboard
  roundRectPath(ctx, x - 38, y - 66, 76, 18, 4);
  fillStroke(ctx, "#6b3f20", 1.8);
  // Mattress
  roundRectPath(ctx, x - 36, y - 52, 72, 52, 4);
  fillStroke(ctx, "#f8fafc", 1.8);
  // Pillows
  roundRectPath(ctx, x - 28, y - 48, 24, 13, 3);
  fillStroke(ctx, "#e2e8f0", 1.3);
  roundRectPath(ctx, x + 4, y - 48, 24, 13, 3);
  fillStroke(ctx, "#e2e8f0", 1.3);
  // Blanket
  roundRectPath(ctx, x - 36, y - 32, 72, 32, 4);
  fillStroke(ctx, "#2563eb", 1.8);
  ctx.fillStyle = "#60a5fa";
  ctx.fillRect(x - 34, y - 32, 68, 6);
}

function drawConsoleTv(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  groundShadow(ctx, x, y + 2, 52, 9, 0.22);
  // Media cabinet
  roundRectPath(ctx, x - 50, y - 24, 100, 24, 3);
  fillStroke(ctx, "#5c3a21", 1.8);
  // Big TV screen
  roundRectPath(ctx, x - 42, y - 62, 84, 36, 3);
  fillStroke(ctx, "#111827", 1.8);
  // Dynamic game scene on TV
  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(x - 38, y - 58, 76, 28);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(x - 38, y - 38, 76, 8);
  const px = x - 18 + Math.sin(time * 0.004) * 20;
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(px, y - 45, 7, 7);
  // Console & controllers on cabinet
  roundRectPath(ctx, x - 34, y - 18, 22, 10, 2);
  fillStroke(ctx, "#f8fafc", 1.2);
  roundRectPath(ctx, x + 8, y - 16, 14, 8, 3);
  fillStroke(ctx, "#ef4444", 1.2);
  roundRectPath(ctx, x + 25, y - 16, 14, 8, 3);
  fillStroke(ctx, "#38bdf8", 1.2);
}

function drawGuitarCorner(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 30, 8, 0.22);
  // Amp speaker
  roundRectPath(ctx, x - 30, y - 34, 30, 32, 3);
  fillStroke(ctx, "#1f2937", 1.8);
  ctx.fillStyle = "#374151";
  ctx.fillRect(x - 26, y - 26, 22, 20);
  // Guitar body on stand
  ctx.beginPath();
  ctx.ellipse(x + 14, y - 14, 12, 15, -0.15, 0, Math.PI * 2);
  fillStroke(ctx, "#d97706", 1.6);
  ctx.beginPath();
  ctx.arc(x + 14, y - 14, 4, 0, Math.PI * 2);
  fillStroke(ctx, "#451a03", 1);
  // Guitar neck
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 16, y - 26);
  ctx.lineTo(x + 22, y - 50);
  ctx.stroke();
}

function drawPhotoWall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 44, 8, 0.2);
  // Gallery frames on the wall
  const frames: [number, number, number, number, string][] = [
    [-42, -62, 24, 18, "#fef08a"],
    [-12, -64, 26, 20, "#bae6fd"],
    [18, -60, 22, 18, "#fecdd3"],
  ];
  for (const [fx, fy, fw, fh, col] of frames) {
    roundRectPath(ctx, x + fx, y + fy, fw, fh, 2);
    fillStroke(ctx, "#fff", 1.6, "#451a03");
    ctx.fillStyle = col;
    ctx.fillRect(x + fx + 3, y + fy + 3, fw - 6, fh - 6);
  }
  // Camera table below
  roundRectPath(ctx, x - 38, y - 26, 76, 24, 3);
  fillStroke(ctx, "#8b5a2b", 1.6);
  // Mirrorless / vintage camera icon on table
  roundRectPath(ctx, x - 12, y - 38, 24, 15, 3);
  fillStroke(ctx, "#334155", 1.5);
  ctx.beginPath();
  ctx.arc(x, y - 30, 5.5, 0, Math.PI * 2);
  fillStroke(ctx, "#94a3b8", 1.3);
  ctx.beginPath();
  ctx.arc(x, y - 30, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#0ea5e9";
  ctx.fill();
}

function drawSportsRack(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 40, 8, 0.2);
  roundRectPath(ctx, x - 36, y - 38, 72, 36, 3);
  fillStroke(ctx, "#64748b", 1.6);
  // Soccer/futsal ball
  ctx.beginPath();
  ctx.arc(x - 18, y - 16, 10, 0, Math.PI * 2);
  fillStroke(ctx, "#f8fafc", 1.5);
  ctx.beginPath();
  ctx.arc(x - 18, y - 16, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  // Basketball
  ctx.beginPath();
  ctx.arc(x + 4, y - 16, 10, 0, Math.PI * 2);
  fillStroke(ctx, "#f97316", 1.5);
  // Badminton racket / dumbbells
  ctx.beginPath();
  ctx.ellipse(x + 24, y - 28, 7, 10, 0.3, 0, Math.PI * 2);
  fillStroke(ctx, "#e2e8f0", 1.4, "#2563eb");
}

function drawFamilyFrame(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  roundRectPath(ctx, x - 38, y - 42, 76, 34, 3);
  fillStroke(ctx, "#b45309", 2);
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(x - 33, y - 37, 66, 24);
  // Little portrait & mountains
  ctx.fillStyle = "#34d399";
  ctx.fillRect(x - 31, y - 23, 62, 10);
  ctx.beginPath();
  ctx.arc(x, y - 27, 6, 0, Math.PI * 2);
  fillStroke(ctx, "#f59e0b", 1.2);
}

function drawSofaTable(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 4, 68, 14, 0.22);
  // Cozy L-sofa
  roundRectPath(ctx, x - 64, y - 54, 128, 30, 6);
  fillStroke(ctx, "#b91c1c", 1.8);
  roundRectPath(ctx, x - 58, y - 42, 116, 18, 4);
  fillStroke(ctx, "#dc2626", 1.4);
  // Cushions
  roundRectPath(ctx, x - 52, y - 50, 22, 14, 3);
  fillStroke(ctx, "#fde68a", 1.2);
  roundRectPath(ctx, x + 30, y - 50, 22, 14, 3);
  fillStroke(ctx, "#fde68a", 1.2);
  // Coffee table in front
  roundRectPath(ctx, x - 40, y - 16, 80, 22, 4);
  fillStroke(ctx, "#8b5a2b", 1.6);
  // Tea cups on table
  ctx.beginPath();
  ctx.arc(x - 12, y - 5, 4, 0, Math.PI * 2);
  fillStroke(ctx, "#fff", 1);
  ctx.beginPath();
  ctx.arc(x + 14, y - 5, 4, 0, Math.PI * 2);
  fillStroke(ctx, "#fde047", 1);
}

function drawTrophyCase(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 38, 8, 0.2);
  roundRectPath(ctx, x - 36, y - 54, 72, 52, 3);
  fillStroke(ctx, "#78350f", 1.8);
  ctx.fillStyle = "#bae6fd";
  ctx.fillRect(x - 31, y - 49, 62, 40);
  // Golden trophies
  for (const tx of [-18, 0, 18]) {
    roundRectPath(ctx, x + tx - 5, y - 34, 10, 14, 2);
    fillStroke(ctx, "#fbbf24", 1.2);
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x + tx - 4, y - 20, 8, 4);
  }
}

function drawPhoneTable(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 32, 8, 0.2);
  roundRectPath(ctx, x - 30, y - 30, 60, 28, 4);
  fillStroke(ctx, "#8b5a2b", 1.8);
  // Retro telephone
  roundRectPath(ctx, x - 20, y - 42, 18, 12, 3);
  fillStroke(ctx, "#dc2626", 1.4);
  // Guestbook / mail
  roundRectPath(ctx, x + 2, y - 40, 20, 13, 2);
  fillStroke(ctx, "#fef3c7", 1.3);
}

function drawHousePlant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 18, 6, 0.2);
  roundRectPath(ctx, x - 12, y - 18, 24, 18, 3);
  fillStroke(ctx, "#c2410c", 1.6);
  for (const [dx, dy, r] of [
    [-10, -28, 11],
    [10, -28, 11],
    [0, -36, 13],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    fillStroke(ctx, "#16a34a", 1.5, "#14532d");
  }
}

function drawKitchenCounter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 58, 9, 0.22);
  roundRectPath(ctx, x - 58, y - 36, 116, 36, 3);
  fillStroke(ctx, "#d6d3d1", 1.8);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(x - 54, y - 20, 108, 18);
  // Sink & coffee maker
  roundRectPath(ctx, x - 44, y - 33, 30, 10, 2);
  fillStroke(ctx, "#94a3b8", 1.2);
  roundRectPath(ctx, x + 18, y - 50, 22, 16, 2);
  fillStroke(ctx, "#1f2937", 1.4);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x + 22, y - 46, 4, 4);
}

function drawFridge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 2, 26, 8, 0.22);
  roundRectPath(ctx, x - 22, y - 62, 44, 62, 4);
  fillStroke(ctx, "#e0f2fe", 1.8);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 21, y - 36);
  ctx.lineTo(x + 21, y - 36);
  ctx.stroke();
  // Handles & magnets
  ctx.fillStyle = "#64748b";
  ctx.fillRect(x - 16, y - 52, 3, 10);
  ctx.fillRect(x - 16, y - 28, 3, 14);
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(x + 6, y - 50, 6, 6);
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(x + 4, y - 24, 7, 5);
}

function drawDiningTable(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  groundShadow(ctx, x, y + 3, 52, 12, 0.22);
  // Chairs
  for (const cx of [-46, 34]) {
    roundRectPath(ctx, x + cx, y - 30, 14, 22, 3);
    fillStroke(ctx, "#9a3412", 1.4);
  }
  roundRectPath(ctx, x - 40, y - 40, 80, 38, 6);
  fillStroke(ctx, "#a16207", 1.8);
  // Plates & food
  ctx.beginPath();
  ctx.arc(x - 18, y - 21, 8, 0, Math.PI * 2);
  fillStroke(ctx, "#fff", 1.2);
  ctx.beginPath();
  ctx.arc(x + 18, y - 21, 8, 0, Math.PI * 2);
  fillStroke(ctx, "#fff", 1.2);
  ctx.beginPath();
  ctx.arc(x, y - 21, 6, 0, Math.PI * 2);
  fillStroke(ctx, "#fb923c", 1.2);
}

function drawDoormat(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  roundRectPath(ctx, x - 42, y - 22, 84, 24, 4);
  fillStroke(ctx, "#b45309", 2, "#451a03");
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 37, y - 18, 74, 16);

  const bob = Math.sin(time * 0.005) * 2.5;
  ctx.font = "800 10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff8e7";
  ctx.fillText("▼ KELUAR (E / Jalan)", x, y - 10 + bob);
}

export function drawCat(
  w: WorldRenderContext,
  cat: CatData,
  state: CatRuntimeState,
  nearPlayer: boolean,
): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = state.x - cameraX;
  const y = state.y - cameraY;
  const hop = state.moving ? Math.abs(Math.sin(time * 0.014)) * 2.5 : 0;
  const tailWag = Math.sin(time * 0.007 + cat.homeX) * 5;
  const dir = state.facing === "left" ? -1 : 1;

  groundShadow(ctx, x, y + 2, 13, 5, 0.22);

  ctx.save();
  ctx.translate(x, y - hop);

  // Tail
  ctx.strokeStyle = cat.coat;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-dir * 8, -8);
  ctx.quadraticCurveTo(-dir * 16, -18, -dir * 12 + tailWag * 0.4, -23);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, -9, 11, 8, 0, 0, Math.PI * 2);
  fillStroke(ctx, cat.coat, 1.5);

  // Secondary patch on back
  ctx.fillStyle = cat.secondaryCoat;
  ctx.beginPath();
  ctx.ellipse(-dir * 2, -11, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Paws
  for (const px of [-6, -2, 3, 7]) {
    ctx.beginPath();
    ctx.arc(px, -2, 2.5, 0, Math.PI * 2);
    fillStroke(ctx, cat.secondaryCoat, 1.1);
  }

  // Head
  const hx = dir * 6;
  const hy = -16;
  // Ears
  for (const ex of [-5, 5]) {
    ctx.beginPath();
    ctx.moveTo(hx + ex - 3, hy - 4);
    ctx.lineTo(hx + ex, hy - 12);
    ctx.lineTo(hx + ex + 3, hy - 4);
    ctx.closePath();
    fillStroke(ctx, cat.coat, 1.3);
    ctx.fillStyle = cat.earInner;
    ctx.beginPath();
    ctx.moveTo(hx + ex - 1.5, hy - 5);
    ctx.lineTo(hx + ex, hy - 9.5);
    ctx.lineTo(hx + ex + 1.5, hy - 5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(hx, hy, 7.5, 0, Math.PI * 2);
  fillStroke(ctx, cat.coat, 1.5);

  // Collar
  ctx.strokeStyle = cat.collarColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(hx - 5, hy + 6);
  ctx.lineTo(hx + 5, hy + 6);
  ctx.stroke();

  // Eyes & pink nose
  ctx.fillStyle = cat.eyeColor;
  ctx.beginPath();
  ctx.arc(hx - 2.6, hy - 1, 1.5, 0, Math.PI * 2);
  ctx.arc(hx + 2.6, hy - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(hx - 2.6, hy - 1, 0.8, 0, Math.PI * 2);
  ctx.arc(hx + 2.6, hy - 1, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.arc(hx, hy + 1.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Name tag under cat
  ctx.font = "700 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const label = `${cat.name} (${cat.gender === "jantan" ? "♂" : "♀"})`;
  const tw = ctx.measureText(label).width + 8;
  roundRectPath(ctx, x - tw / 2, y + 4, tw, 13, 3);
  fillStroke(ctx, "#fff8e7", 1.2, "#5b3a29");
  ctx.fillStyle = "#3b2a1a";
  ctx.fillText(label, x, y + 6);

  if (nearPlayer) {
    const meowIdx = Math.floor(time / 1800) % cat.meows.length;
    drawSpeechBubble(ctx, x, y - 34, cat.meows[meowIdx], time);
  }
}

