import {
  BUCKET_LIST,
  FAMILY_PHOTO_SRC,
  HOUSE_DOORWAYS,
  HOUSE_HEIGHT,
  HOUSE_ROOMS,
  HOUSE_WALLS,
  HOUSE_WIDTH,
  WORK_PLAYLIST,
  getFurnitureRect,
  type CatData,
  type FurnitureKind,
  type HouseDialogueItem,
  type RoomRect,
} from "@/data/houseData";
import { PLAYER_LOOK } from "@/data/worldData";
import { drawSpeechBubble } from "./drawSpeechBubble";
import { OUTLINE, fillStroke, groundShadow, roundRectPath, shade } from "./shapes";
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

export interface FurnitureDrawOptions {
  /** Player is seated on this item (desk chair back is drawn separately) */
  occupied?: boolean;
  /** Player is sleeping in this bed */
  sleeping?: boolean;
}

/** How far each furniture kind visually rises above its floor footprint */
const RISE: Record<FurnitureKind, number> = {
  bed: 44,
  nightstand: 30,
  bookshelf: 58,
  laptop_desk: 22,
  valorant_setup: 46,
  music_corner: 42,
  photo_wall: 42,
  family_photo: 34,
  sofa: 16,
  coffee_table: 8,
  trophy_case: 52,
  phone_table: 18,
  plant: 30,
  dumbbell_rack: 22,
  bench_press: 22,
  treadmill: 26,
  doormat: 0,
};

export function furnitureTopY(item: HouseDialogueItem): number {
  return item.y - item.height - RISE[item.kind];
}

// ----------------------------------------------------------------------------
// Family photo (optional PNG)
// ----------------------------------------------------------------------------

let familyImg: HTMLImageElement | null = null;
let familyImgState: "idle" | "loading" | "ok" | "error" = "idle";

function getFamilyPhoto(): HTMLImageElement | null {
  if (familyImgState === "idle" && typeof Image !== "undefined") {
    familyImgState = "loading";
    familyImg = new Image();
    familyImg.onload = () => {
      familyImgState = "ok";
    };
    familyImg.onerror = () => {
      familyImgState = "error";
    };
    familyImg.src = FAMILY_PHOTO_SRC;
  }
  return familyImgState === "ok" ? familyImg : null;
}

// ----------------------------------------------------------------------------
// Ground: floors, back walls, doorways, rugs, wall decor
// ----------------------------------------------------------------------------

export function drawHouseGround(w: WorldRenderContext): void {
  const { ctx, cameraX, cameraY, viewW, viewH, time } = w;

  ctx.fillStyle = "#1d1612";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(36, 30, HOUSE_WIDTH - 52, HOUSE_HEIGHT - 26);

  for (const r of HOUSE_ROOMS) drawRoomFloor(ctx, r);
  for (const r of HOUSE_ROOMS) drawBackWall(ctx, r);

  // Doorways cut through walls and back wall faces
  for (const d of HOUSE_DOORWAYS) {
    drawPlanks(ctx, d.x, d.y, d.w, d.h, "#c4935f", "#b9895a");
    if (d.h > d.w) continue;
    ctx.fillStyle = "rgba(60, 35, 20, 0.18)";
    ctx.fillRect(d.x, d.y, d.w, 18);
    ctx.fillStyle = "#6b4226";
    ctx.fillRect(d.x - 3, d.y + 10, 5, d.h - 10);
    ctx.fillRect(d.x + d.w - 2, d.y + 10, 5, d.h - 10);
  }

  // Rugs
  drawRug(ctx, 250, 240, 132, 76, "#5b7fa6", "#dbeafe", "round");
  drawRug(ctx, 680, 238, 160, 84, "#2d2a4a", "#f43f5e", "rect");
  drawRug(ctx, 340, 470, 230, 108, "#a8483c", "#f3d9a4", "rect");
  drawGymMats(ctx);

  drawCatBowls(ctx, 196, 586);
  drawWallDecor(ctx, time);

  for (const wall of HOUSE_WALLS) {
    ctx.fillStyle = "#5a3a26";
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = "#7a5034";
    ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, Math.max(2, wall.h - 6));
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }

  // Front door frame
  ctx.fillStyle = "#3b2416";
  ctx.fillRect(403, 598, 6, 24);
  ctx.fillRect(511, 598, 6, 24);

  for (const r of HOUSE_ROOMS) drawRoomLabel(ctx, r);

  ctx.restore();
}

function drawPlanks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
  alt: string,
): void {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const plankH = 16;
  ctx.lineWidth = 1;
  for (let py = 0, row = 0; py < h; py += plankH, row++) {
    const ph = Math.min(plankH, h - py);
    if (row % 2 === 1) {
      ctx.fillStyle = alt;
      ctx.fillRect(x, y + py, w, ph);
    }
    ctx.strokeStyle = "rgba(70, 40, 20, 0.22)";
    ctx.beginPath();
    ctx.moveTo(x, y + py + 0.5);
    ctx.lineTo(x + w, y + py + 0.5);
    ctx.stroke();
    // Staggered plank seams
    const offset = ((row * 53) % 90) + 20;
    ctx.strokeStyle = "rgba(70, 40, 20, 0.16)";
    for (let sx = offset; sx < w; sx += 110) {
      ctx.beginPath();
      ctx.moveTo(x + sx + 0.5, y + py);
      ctx.lineTo(x + sx + 0.5, y + py + ph);
      ctx.stroke();
    }
  }
}

function drawRoomFloor(ctx: CanvasRenderingContext2D, r: RoomRect): void {
  switch (r.floor) {
    case "wood":
      drawPlanks(ctx, r.x, r.y, r.w, r.h, "#d2a26f", "#c8986a");
      break;
    case "dark_wood":
      drawPlanks(ctx, r.x, r.y, r.w, r.h, "#9a6a45", "#91633f");
      break;
    case "warm_wood":
      drawPlanks(ctx, r.x, r.y, r.w, r.h, "#d8a873", "#cf9e6a");
      break;
    case "gym": {
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      const sz = 34;
      ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
      ctx.lineWidth = 1;
      for (let gx = r.x; gx <= r.x + r.w; gx += sz) {
        ctx.beginPath();
        ctx.moveTo(gx + 0.5, r.y);
        ctx.lineTo(gx + 0.5, r.y + r.h);
        ctx.stroke();
      }
      for (let gy = r.y; gy <= r.y + r.h; gy += sz) {
        ctx.beginPath();
        ctx.moveTo(r.x, gy + 0.5);
        ctx.lineTo(r.x + r.w, gy + 0.5);
        ctx.stroke();
      }
      // Rubber speckles
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let i = 0; i < 90; i++) {
        const px = r.x + ((i * 97) % r.w);
        const py = r.y + ((i * 61) % r.h);
        ctx.fillRect(px, py, 2, 2);
      }
      break;
    }
  }
}

const WALLPAPER: Record<RoomRect["wallpaper"], { base: string; stripe: string; trim: string }> = {
  bedroom: { base: "#cfe0ec", stripe: "#bed3e3", trim: "#7c5a3c" },
  hobby: { base: "#2f3354", stripe: "#3a3f66", trim: "#1e2038" },
  living: { base: "#f2e4c4", stripe: "#e8d6b0", trim: "#8a5a36" },
  gym: { base: "#cdd2d8", stripe: "#bfc5cc", trim: "#475569" },
};

function drawBackWall(ctx: CanvasRenderingContext2D, r: RoomRect): void {
  const p = WALLPAPER[r.wallpaper];
  ctx.fillStyle = p.base;
  ctx.fillRect(r.x, r.y, r.w, r.wall);
  ctx.fillStyle = p.stripe;
  for (let sx = r.x + 6; sx < r.x + r.w; sx += 18) {
    ctx.fillRect(sx, r.y, 7, r.wall);
  }
  if (r.wallpaper === "living") {
    // Wainscot panel
    ctx.fillStyle = "#c79a68";
    ctx.fillRect(r.x, r.y + r.wall - 16, r.w, 16);
    ctx.strokeStyle = "rgba(90, 55, 30, 0.35)";
    for (let sx = r.x + 10; sx < r.x + r.w; sx += 30) {
      ctx.strokeRect(sx + 0.5, r.y + r.wall - 13 + 0.5, 22, 10);
    }
  }
  if (r.wallpaper === "gym") {
    ctx.fillStyle = "#f97316";
    ctx.fillRect(r.x, r.y + r.wall - 18, r.w, 4);
  }
  // Ceiling shadow & baseboard
  const grad = ctx.createLinearGradient(0, r.y, 0, r.y + 12);
  grad.addColorStop(0, "rgba(0,0,0,0.28)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, 12);
  ctx.fillStyle = p.trim;
  ctx.fillRect(r.x, r.y + r.wall - 5, r.w, 5);
  // Soft floor shadow under the wall
  const g2 = ctx.createLinearGradient(0, r.y + r.wall, 0, r.y + r.wall + 10);
  g2.addColorStop(0, "rgba(0,0,0,0.2)");
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(r.x, r.y + r.wall, r.w, 10);
}

function drawRoomLabel(ctx: CanvasRenderingContext2D, r: RoomRect): void {
  ctx.font = "800 10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(r.label).width + 16;
  roundRectPath(ctx, r.labelPos.x - tw / 2, r.labelPos.y - 8, tw, 16, 8);
  ctx.fillStyle = "rgba(43, 29, 18, 0.55)";
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.fillText(r.label, r.labelPos.x, r.labelPos.y + 0.5);
}

function drawRug(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  main: string,
  trim: string,
  shape: "rect" | "round",
): void {
  if (shape === "round") {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
    fillStroke(ctx, main, 1.5, shade(main, -50));
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2 - 8, h / 2 - 7, 0, 0, Math.PI * 2);
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, 6);
  fillStroke(ctx, main, 1.5, shade(main, -50));
  ctx.strokeStyle = trim;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2 + 7, cy - h / 2 + 7, w - 14, h - 14);
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w / 2 + 13, cy - h / 2 + 13, w - 26, h - 26);
  ctx.setLineDash([]);
}

function drawGymMats(ctx: CanvasRenderingContext2D): void {
  roundRectPath(ctx, 664, 444, 136, 76, 4);
  fillStroke(ctx, "#1f2937", 1.2, "#0f172a");
  roundRectPath(ctx, 612, 520, 60, 70, 4);
  fillStroke(ctx, "#2563eb", 1.2, "#1e3a8a");
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(612, 555);
  ctx.lineTo(672, 555);
  ctx.stroke();
}

function drawCatBowls(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  roundRectPath(ctx, x - 22, y - 9, 44, 18, 5);
  fillStroke(ctx, "#f59e0b", 1.2);
  for (const [bx, fill] of [
    [-10, "#7dd3fc"],
    [10, "#92400e"],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x + bx, y, 7.5, 5, 0, 0, Math.PI * 2);
    fillStroke(ctx, "#f8fafc", 1.2);
    ctx.beginPath();
    ctx.ellipse(x + bx, y, 5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function drawWallDecor(ctx: CanvasRenderingContext2D, time: number): void {
  // Kamar Tidur: window above the laptop desk
  drawWindow(ctx, 352, 60, 46, 30);

  // Ruang Hobi: RGB strip along the ceiling
  const hue = (time * 0.05) % 360;
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `hsl(${(hue + i * 14) % 360}, 90%, 60%)`;
    ctx.fillRect(464 + i * 16, 57, 12, 3);
  }

  // Ruang Tamu: wall clock showing the real time
  drawClock(ctx, 452, 346, 11);
  drawWindow(ctx, 246, 334, 30, 22);

  // Ruang Gym: big mirror and motivational sign
  roundRectPath(ctx, 682, 332, 116, 30, 2);
  fillStroke(ctx, "#94a3b8", 1.6, "#334155");
  const mg = ctx.createLinearGradient(682, 332, 798, 362);
  mg.addColorStop(0, "#e0f2fe");
  mg.addColorStop(0.5, "#bae6fd");
  mg.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = mg;
  ctx.fillRect(685, 335, 110, 24);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  for (const sx of [705, 760]) {
    ctx.beginPath();
    ctx.moveTo(sx, 358);
    ctx.lineTo(sx + 16, 336);
    ctx.stroke();
  }
  roundRectPath(ctx, 806, 334, 62, 24, 3);
  fillStroke(ctx, "#111827", 1.2);
  ctx.font = "900 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f97316";
  ctx.fillText("NO PAIN", 837, 341.5);
  ctx.fillText("NO GAIN", 837, 350.5);
}

function drawWindow(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number): void {
  roundRectPath(ctx, cx - w / 2 - 3, y - 3, w + 6, h + 6, 2);
  fillStroke(ctx, "#f8fafc", 1.4);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#7dd3fc");
  g.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = g;
  ctx.fillRect(cx - w / 2, y, w, h);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(cx - 1, y, 2, h);
  ctx.fillRect(cx - w / 2, y + h / 2 - 1, w, 2);
  // Curtains
  ctx.fillStyle = "#f9a8d4";
  ctx.fillRect(cx - w / 2 - 6, y - 4, 6, h + 8);
  ctx.fillRect(cx + w / 2, y - 4, 6, h + 8);
}

function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fillStroke(ctx, "#fffdf5", 2, "#5b3a29");
  const now = new Date();
  const h = ((now.getHours() % 12) + now.getMinutes() / 60) * (Math.PI / 6);
  const m = now.getMinutes() * (Math.PI / 30);
  ctx.strokeStyle = OUTLINE;
  ctx.lineCap = "round";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(h) * r * 0.5, y - Math.cos(h) * r * 0.5);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(m) * r * 0.78, y - Math.cos(m) * r * 0.78);
  ctx.stroke();
}

// ----------------------------------------------------------------------------
// Furniture
// ----------------------------------------------------------------------------

export function drawFurnitureItem(
  w: WorldRenderContext,
  item: HouseDialogueItem,
  highlight: boolean,
  opts: FurnitureDrawOptions = {},
): void {
  const { ctx, cameraX, cameraY, time } = w;
  const r = getFurnitureRect(item);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  ctx.lineJoin = "round";

  const x = item.x;
  const T = r.top;
  const F = r.bottom;

  switch (item.kind) {
    case "bed":
      drawBed(ctx, x, T, F, !!opts.sleeping, time);
      break;
    case "nightstand":
      drawNightstand(ctx, x, T, F);
      break;
    case "bookshelf":
      drawBookshelf(ctx, x, T, F);
      break;
    case "laptop_desk":
      drawLaptopDesk(ctx, x, T, F, time, !!opts.occupied);
      break;
    case "valorant_setup":
      drawValorantSetup(ctx, x, T, F, time);
      break;
    case "music_corner":
      drawMusicCorner(ctx, x, T, F, time);
      break;
    case "photo_wall":
      drawPhotoWall(ctx, x, T, F);
      break;
    case "family_photo":
      drawFamilyPhoto(ctx, x, T);
      break;
    case "sofa":
      drawSofa(ctx, x, T, F);
      break;
    case "coffee_table":
      drawCoffeeTable(ctx, x, T, F);
      break;
    case "trophy_case":
      drawTrophyCase(ctx, x, T, F);
      break;
    case "phone_table":
      drawPhoneTable(ctx, x, T, F);
      break;
    case "plant":
      drawPlant(ctx, x, F);
      break;
    case "dumbbell_rack":
      drawDumbbellRack(ctx, x, T, F);
      break;
    case "bench_press":
      drawBenchPress(ctx, x, T, F);
      break;
    case "treadmill":
      drawTreadmill(ctx, x, T, F, time);
      break;
    case "doormat":
      drawDoormat(ctx, x, F, time);
      break;
  }

  if (highlight) drawHighlight(ctx, item, r, time);

  ctx.restore();
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  item: HouseDialogueItem,
  r: ReturnType<typeof getFurnitureRect>,
  time: number,
): void {
  const pulse = 0.6 + Math.sin(time * 0.007) * 0.3;
  ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  const top = item.kind === "family_photo" ? r.top - RISE.family_photo : r.top;
  roundRectPath(ctx, r.left - 5, top - 5, r.right - r.left + 10, r.bottom - top + 10, 8);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBed(
  ctx: CanvasRenderingContext2D,
  x: number,
  T: number,
  F: number,
  sleeping: boolean,
  time: number,
): void {
  drawBucketBoard(ctx, x, T - 45);

  // Headboard against the wall
  roundRectPath(ctx, x - 42, T - 12, 84, 20, 5);
  fillStroke(ctx, "#7a4a28", 1.6);
  ctx.fillStyle = "#94603a";
  ctx.fillRect(x - 36, T - 8, 72, 4);

  groundShadow(ctx, x, F, 44, 6, 0.22);
  // Frame
  roundRectPath(ctx, x - 40, T + 4, 80, F - T - 4, 5);
  fillStroke(ctx, "#8b5a33", 1.6);
  // Mattress
  roundRectPath(ctx, x - 36, T + 6, 72, F - T - 16, 5);
  fillStroke(ctx, "#f8fafc", 1.4);
  // Pillows
  roundRectPath(ctx, x - 30, T + 11, 26, 15, 5);
  fillStroke(ctx, "#ffffff", 1.2);
  roundRectPath(ctx, x + 4, T + 11, 26, 15, 5);
  fillStroke(ctx, "#ffffff", 1.2);

  if (sleeping) drawSleepingHead(ctx, x, T + 22);

  // Blanket
  const bTop = sleeping ? T + 30 : T + 36;
  ctx.beginPath();
  ctx.moveTo(x - 37, bTop);
  if (sleeping) {
    ctx.quadraticCurveTo(x, bTop - 8, x + 37, bTop);
  } else {
    ctx.lineTo(x + 37, bTop);
  }
  ctx.lineTo(x + 37, F - 12);
  ctx.lineTo(x - 37, F - 12);
  ctx.closePath();
  fillStroke(ctx, "#3b82f6", 1.5);
  ctx.fillStyle = "#93c5fd";
  ctx.fillRect(x - 36, bTop + 1, 72, 6);
  // Blanket pattern
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  for (let py = bTop + 14; py < F - 16; py += 12) {
    for (let px = x - 30; px < x + 32; px += 14) {
      ctx.fillRect(px, py, 6, 6);
    }
  }
  if (sleeping) {
    ctx.strokeStyle = "rgba(30, 58, 138, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, bTop + 28, 16, 24, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // Front face of the frame
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(x - 40, F - 10, 80, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 40, F - 10, 80, 10);

  if (sleeping) {
    ctx.font = "900 12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 3; i++) {
      const phase = ((time * 0.0006 + i / 3) % 1 + 1) % 1;
      ctx.globalAlpha = 1 - phase;
      ctx.fillStyle = "#e0e7ff";
      ctx.strokeStyle = "#312e81";
      ctx.lineWidth = 2.5;
      const zx = x + 18 + phase * 20;
      const zy = T + 14 - phase * 30;
      ctx.strokeText("z", zx, zy);
      ctx.fillText("z", zx, zy);
    }
    ctx.globalAlpha = 1;
  }
}

function drawBucketBoard(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const w = 104;
  const h = 42;
  roundRectPath(ctx, x - w / 2, y, w, h, 3);
  fillStroke(ctx, "#c98f55", 1.6, "#5c3a1b");
  roundRectPath(ctx, x - w / 2 + 4, y + 3, w - 8, h - 6, 2);
  fillStroke(ctx, "#fffbeb", 1);
  // Pins
  ctx.fillStyle = "#ef4444";
  for (const px of [x - w / 2 + 7, x + w / 2 - 7]) {
    ctx.beginPath();
    ctx.arc(px, y + 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "900 6.5px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#b91c1c";
  ctx.fillText("BUCKET LIST", x - w / 2 + 12, y + 4);

  ctx.font = "700 6px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#3b2a1a";
  let ly = y + 12;
  for (const item of BUCKET_LIST) {
    const [main, extra] = item.split(" (");
    ctx.strokeStyle = "#3b2a1a";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - w / 2 + 8.5, ly + 0.5, 4.5, 4.5);
    ctx.fillText(main, x - w / 2 + 16, ly);
    if (extra) {
      ly += 6.5;
      ctx.fillStyle = "#6b4f3a";
      ctx.fillText(`(${extra}`, x - w / 2 + 16, ly);
      ctx.fillStyle = "#3b2a1a";
    }
    ly += 7.5;
  }
}

function drawSleepingHead(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const look = PLAYER_LOOK;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  fillStroke(ctx, look.skin, 1.3);
  // Hair (top of head toward the headboard)
  ctx.beginPath();
  ctx.arc(x, y - 1, 10.6, Math.PI * 1.02, Math.PI * 1.98);
  ctx.lineTo(x + 8, y - 2);
  ctx.lineTo(x + 4, y - 4);
  ctx.lineTo(x, y - 2.5);
  ctx.lineTo(x - 4, y - 4.5);
  ctx.lineTo(x - 8, y - 2);
  ctx.closePath();
  fillStroke(ctx, look.hair, 1.3);
  // Closed eyes
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  for (const ex of [-3.6, 3.6]) {
    ctx.beginPath();
    ctx.arc(x + ex, y + 2, 1.8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 120, 120, 0.4)";
  for (const bx of [-6.5, 6.5]) {
    ctx.beginPath();
    ctx.ellipse(x + bx, y + 5, 1.8, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNightstand(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  groundShadow(ctx, x, F, 15, 4, 0.2);
  roundRectPath(ctx, x - 13, T - 2, 26, F - T + 2, 3);
  fillStroke(ctx, "#94603a", 1.5);
  ctx.fillStyle = "#7a4a28";
  ctx.fillRect(x - 13, F - 14, 26, 14);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 13, F - 14, 26, 14);
  ctx.fillStyle = "#fcd34d";
  ctx.fillRect(x - 2, F - 8, 4, 2);
  // Lamp
  ctx.fillStyle = "#5b3a29";
  ctx.fillRect(x - 1.5, T - 14, 3, 12);
  ctx.beginPath();
  ctx.moveTo(x - 9, T - 14);
  ctx.lineTo(x + 9, T - 14);
  ctx.lineTo(x + 6, T - 26);
  ctx.lineTo(x - 6, T - 26);
  ctx.closePath();
  fillStroke(ctx, "#fde68a", 1.3);
  const g = ctx.createRadialGradient(x, T - 18, 2, x, T - 18, 26);
  g.addColorStop(0, "rgba(253, 230, 138, 0.35)");
  g.addColorStop(1, "rgba(253, 230, 138, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - 26, T - 44, 52, 52);
}

function drawBookshelf(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  const w = 70;
  const top = T - 50;
  groundShadow(ctx, x, F, 36, 5, 0.22);
  roundRectPath(ctx, x - w / 2, top, w, F - top, 3);
  fillStroke(ctx, "#7c4a24", 1.6);
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
  for (let row = 0; row < 3; row++) {
    const sy = top + 5 + row * 19;
    ctx.fillStyle = "#4a2c14";
    ctx.fillRect(x - w / 2 + 4, sy, w - 8, 15);
    let bx = x - w / 2 + 6;
    let i = row * 3;
    while (bx < x + w / 2 - 10) {
      const bw = 4 + ((i * 7) % 4);
      const bh = 10 + ((i * 5) % 5);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(bx, sy + 15 - bh, bw, bh);
      bx += bw + 1;
      i++;
    }
  }
  ctx.fillStyle = "#5c3a1b";
  ctx.fillRect(x - w / 2, F - 8, w, 8);
}

function drawLaptopDesk(
  ctx: CanvasRenderingContext2D,
  x: number,
  T: number,
  F: number,
  time: number,
  occupied: boolean,
): void {
  const deskFront = T + 40;
  groundShadow(ctx, x, deskFront + 6, 54, 6, 0.2);
  // Legs
  ctx.fillStyle = "#5c3a1b";
  ctx.fillRect(x - 48, deskFront - 4, 6, 14);
  ctx.fillRect(x + 42, deskFront - 4, 6, 14);
  // Desk top + front face
  roundRectPath(ctx, x - 52, T + 4, 104, 30, 3);
  fillStroke(ctx, "#a66f42", 1.6);
  ctx.fillStyle = "#8b5a33";
  ctx.fillRect(x - 52, T + 32, 104, 8);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 52, T + 32, 104, 8);

  // Laptop
  roundRectPath(ctx, x - 17, T - 8, 34, 22, 2);
  fillStroke(ctx, "#475569", 1.4);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x - 14, T - 5, 28, 16);
  const scroll = Math.floor(time / 400) % 4;
  const lineColors = ["#38bdf8", "#f472b6", "#4ade80", "#fbbf24"];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = lineColors[(i + scroll) % 4];
    ctx.fillRect(x - 12 + (i % 2) * 3, T - 3 + i * 3.5, 10 + ((i * 5) % 9), 1.6);
  }
  roundRectPath(ctx, x - 20, T + 14, 40, 9, 2);
  fillStroke(ctx, "#94a3b8", 1.3);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(x - 15, T + 16, 30, 4);

  // Mug, notebook and tiny plant
  roundRectPath(ctx, x + 30, T + 10, 9, 10, 2);
  fillStroke(ctx, "#f97316", 1.2);
  roundRectPath(ctx, x - 44, T + 12, 18, 13, 1);
  fillStroke(ctx, "#fef3c7", 1.1);
  ctx.beginPath();
  ctx.arc(x + 43, T + 6, 5, 0, Math.PI * 2);
  fillStroke(ctx, "#22c55e", 1.1, "#14532d");

  // Chair seat
  const seatY = F - 26;
  roundRectPath(ctx, x - 15, seatY, 30, 14, 5);
  fillStroke(ctx, "#334155", 1.4);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(x - 1.5, seatY + 14, 3, 6);
  if (!occupied) drawChairBack(ctx, x, F);
}

function drawChairBack(ctx: CanvasRenderingContext2D, x: number, F: number): void {
  roundRectPath(ctx, x - 14, F - 18, 28, 18, 5);
  fillStroke(ctx, "#475569", 1.5);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(x - 9, F - 14, 18, 3);
}

/** Drawn after the seated player so the backrest covers their lower back */
export function drawDeskChairBack(w: WorldRenderContext, item: HouseDialogueItem): void {
  const { ctx, cameraX, cameraY } = w;
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  drawChairBack(ctx, item.x, item.y);
  ctx.restore();
}

function drawValorantSetup(
  ctx: CanvasRenderingContext2D,
  x: number,
  T: number,
  F: number,
  time: number,
): void {
  // Wall poster
  roundRectPath(ctx, x - 30, T - 46, 60, 34, 2);
  fillStroke(ctx, "#ff4655", 1.5, "#111827");
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(x - 10, T - 41);
  ctx.lineTo(x - 2, T - 25);
  ctx.lineTo(x + 2, T - 25);
  ctx.lineTo(x - 6, T - 41);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 10, T - 41);
  ctx.lineTo(x + 4, T - 29);
  ctx.lineTo(x + 7, T - 29);
  ctx.lineTo(x + 12, T - 39);
  ctx.closePath();
  ctx.fill();
  ctx.font = "900 6px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VALORANT", x, T - 18);

  const deskFront = T + 40;
  groundShadow(ctx, x, deskFront + 6, 62, 6, 0.22);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 56, deskFront - 4, 6, 14);
  ctx.fillRect(x + 50, deskFront - 4, 6, 14);
  roundRectPath(ctx, x - 60, T + 4, 120, 30, 3);
  fillStroke(ctx, "#1f2937", 1.6);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 60, T + 32, 120, 8);
  // RGB strip under the desk edge
  const hue = (time * 0.12) % 360;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `hsl(${(hue + i * 30) % 360}, 95%, 60%)`;
    ctx.fillRect(x - 58 + i * 10, T + 35, 8, 2);
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 60, T + 32, 120, 8);

  // Monitor
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 3, T + 6, 6, 8);
  roundRectPath(ctx, x - 30, T - 12, 60, 22, 2);
  fillStroke(ctx, "#0b0f19", 1.5);
  ctx.fillStyle = "#1e1b2e";
  ctx.fillRect(x - 27, T - 9, 54, 16);
  ctx.fillStyle = "#ff4655";
  ctx.fillRect(x - 27, T + 3, 54, 4);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(x - 20, T - 4, 10, 7);
  ctx.fillRect(x + 8, T - 6, 12, 9);
  // Crosshair
  const cx = x + Math.sin(time * 0.002) * 6;
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, T - 1);
  ctx.lineTo(cx + 3, T - 1);
  ctx.moveTo(cx, T - 4);
  ctx.lineTo(cx, T + 2);
  ctx.stroke();

  // PC tower with RGB fans
  roundRectPath(ctx, x + 36, T - 14, 20, 30, 2);
  fillStroke(ctx, "#111827", 1.4);
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(x + 46, T - 6 + i * 12, 4, 0, Math.PI * 2);
    ctx.strokeStyle = `hsl(${(hue + i * 120) % 360}, 95%, 60%)`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  // Keyboard + mouse
  roundRectPath(ctx, x - 22, T + 16, 36, 9, 2);
  fillStroke(ctx, "#111827", 1.2);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `hsl(${(hue + i * 50) % 360}, 90%, 62%)`;
    ctx.fillRect(x - 19 + i * 6.5, T + 19, 5, 3);
  }
  roundRectPath(ctx, x + 18, T + 17, 7, 9, 3);
  fillStroke(ctx, "#111827", 1.1);
  // Headset on the desk
  ctx.strokeStyle = "#ff4655";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x - 44, T + 18, 6, Math.PI, Math.PI * 2);
  ctx.stroke();

  // Gaming chair
  const seatY = F - 26;
  roundRectPath(ctx, x - 16, seatY, 32, 14, 5);
  fillStroke(ctx, "#111827", 1.4);
  roundRectPath(ctx, x - 15, F - 20, 30, 20, 6);
  fillStroke(ctx, "#1f2937", 1.5);
  ctx.fillStyle = "#ff4655";
  ctx.fillRect(x - 11, F - 16, 4, 13);
  ctx.fillRect(x + 7, F - 16, 4, 13);
}

function drawMusicCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  T: number,
  F: number,
  time: number,
): void {
  // Vinyl records on the wall
  for (const [vx, c] of [
    [-22, "#f43f5e"],
    [22, "#22d3ee"],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + vx, T - 32, 11, 0, Math.PI * 2);
    fillStroke(ctx, "#111827", 1.4);
    ctx.beginPath();
    ctx.arc(x + vx, T - 32, 4, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  }

  groundShadow(ctx, x, F, 48, 5, 0.22);
  // Speakers
  for (const sx of [-46, 34]) {
    roundRectPath(ctx, x + sx, T - 16, 12 + 0, F - T + 16, 2);
    fillStroke(ctx, "#1f2937", 1.4);
    const beat = 1 + Math.max(0, Math.sin(time * 0.012)) * 0.25;
    ctx.beginPath();
    ctx.arc(x + sx + 6, T + 4, 4 * beat, 0, Math.PI * 2);
    fillStroke(ctx, "#4b5563", 1);
    ctx.beginPath();
    ctx.arc(x + sx + 6, T - 8, 2.5, 0, Math.PI * 2);
    fillStroke(ctx, "#4b5563", 1);
  }
  // Cabinet with turntable
  roundRectPath(ctx, x - 32, T + 2, 64, F - T - 2, 3);
  fillStroke(ctx, "#a16207", 1.5);
  ctx.fillStyle = "#854d0e";
  ctx.fillRect(x - 32, F - 10, 64, 10);
  ctx.beginPath();
  ctx.ellipse(x - 8, T + 12, 12, 7, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#111827", 1.2);
  const ang = time * 0.006;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 8, T + 12);
  ctx.lineTo(x - 8 + Math.cos(ang) * 10, T + 12 + Math.sin(ang) * 6);
  ctx.stroke();
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(x - 8, T + 12, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Headphones
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 17, T + 13, 6, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x + 9, T + 12, 4, 6);
  ctx.fillRect(x + 21, T + 12, 4, 6);

  // Now playing LCD cycling the work playlist
  const song = WORK_PLAYLIST[Math.floor(time / 3500) % WORK_PLAYLIST.length];
  ctx.font = "800 6.5px ui-sans-serif, system-ui, sans-serif";
  const label = `♪ ${song}`;
  const tw = ctx.measureText(label).width + 8;
  roundRectPath(ctx, x - tw / 2, F - 9, tw, 8, 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.fillStyle = "#4ade80";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, F - 4.8);

  // Floating notes
  ctx.font = "900 11px ui-sans-serif, system-ui, sans-serif";
  for (let i = 0; i < 2; i++) {
    const phase = ((time * 0.0005 + i * 0.5) % 1 + 1) % 1;
    ctx.globalAlpha = 1 - phase;
    ctx.fillStyle = i ? "#f472b6" : "#a78bfa";
    ctx.fillText(i ? "♫" : "♪", x + (i ? 30 : -30) + Math.sin(phase * 6) * 3, T - 18 - phase * 24);
  }
  ctx.globalAlpha = 1;
}

function drawPhotoWall(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  const frames: [number, number, number, number, string][] = [
    [-34, -44, 22, 17, "#fef08a"],
    [-8, -46, 24, 20, "#bae6fd"],
    [20, -42, 18, 15, "#fecdd3"],
  ];
  for (const [fx, fy, fw, fh, col] of frames) {
    roundRectPath(ctx, x + fx, T + fy, fw, fh, 1.5);
    fillStroke(ctx, "#fff", 1.4, "#451a03");
    ctx.fillStyle = col;
    ctx.fillRect(x + fx + 3, T + fy + 3, fw - 6, fh - 6);
  }
  groundShadow(ctx, x, F, 38, 5, 0.2);
  roundRectPath(ctx, x - 36, T + 2, 72, F - T - 2, 3);
  fillStroke(ctx, "#8b5a33", 1.5);
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(x - 36, F - 9, 72, 9);
  // Camera
  roundRectPath(ctx, x - 13, T - 6, 26, 16, 3);
  fillStroke(ctx, "#334155", 1.4);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(x - 9, T - 9, 8, 4);
  ctx.beginPath();
  ctx.arc(x + 1, T + 2, 5.5, 0, Math.PI * 2);
  fillStroke(ctx, "#94a3b8", 1.2);
  ctx.beginPath();
  ctx.arc(x + 1, T + 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#0ea5e9";
  ctx.fill();
}

function drawFamilyPhoto(ctx: CanvasRenderingContext2D, x: number, T: number): void {
  const w = 84;
  const h = 32;
  const fx = x - w / 2;
  const fy = T - h - 2;
  roundRectPath(ctx, fx - 2, fy - 2, w + 4, h + 4, 3);
  fillStroke(ctx, "#b7791f", 2, "#5b3a1b");
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(fx + 3, fy + 3, w - 6, h - 6);

  const img = getFamilyPhoto();
  const ix = fx + 5;
  const iy = fy + 5;
  const iw = w - 10;
  const ih = h - 10;
  if (img) {
    // Cover-fit crop
    const scale = Math.max(iw / img.width, ih / img.height);
    const sw = iw / scale;
    const sh = ih / scale;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, ix, iy, iw, ih);
  } else {
    const g = ctx.createLinearGradient(0, iy, 0, iy + ih);
    g.addColorStop(0, "#bae6fd");
    g.addColorStop(1, "#86efac");
    ctx.fillStyle = g;
    ctx.fillRect(ix, iy, iw, ih);
    const people: [number, number, string][] = [
      [-24, 1, "#7c2d12"],
      [-8, 0, "#1f2937"],
      [8, 3, "#3f3f46"],
      [22, 2, "#78350f"],
    ];
    for (const [px, scaleY, hair] of people) {
      const s = 1 - scaleY * 0.08;
      ctx.fillStyle = "#60a5fa";
      roundRectPath(ctx, x + px - 5 * s, iy + ih - 9 * s, 10 * s, 9 * s, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + px, iy + ih - 12 * s, 4 * s, 0, Math.PI * 2);
      ctx.fillStyle = "#f2c9a0";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + px, iy + ih - 13.5 * s, 4 * s, Math.PI, Math.PI * 2);
      ctx.fillStyle = hair;
      ctx.fill();
    }
  }
  ctx.strokeStyle = "rgba(91, 58, 27, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
}

function drawSofa(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  const body = "#4f7a8c";
  groundShadow(ctx, x, F + 2, 80, 7, 0.25);
  // Backrest
  roundRectPath(ctx, x - 74, T - 14, 148, 30, 8);
  fillStroke(ctx, shade(body, -18), 1.6);
  // Seat cushions
  for (const sx of [-58, 2]) {
    roundRectPath(ctx, x + sx, T + 12, 56, 28, 5);
    fillStroke(ctx, body, 1.4);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x + sx + 4, T + 15, 48, 4);
  }
  // Throw pillows
  roundRectPath(ctx, x - 56, T - 4, 20, 16, 5);
  fillStroke(ctx, "#fcd34d", 1.2);
  roundRectPath(ctx, x + 36, T - 4, 20, 16, 5);
  fillStroke(ctx, "#f9a8d4", 1.2);
  // Armrests
  for (const ax of [-76, 60]) {
    roundRectPath(ctx, x + ax, T - 4, 16, F - T + 2, 6);
    fillStroke(ctx, shade(body, -10), 1.5);
  }
  // Front face
  ctx.fillStyle = shade(body, -36);
  ctx.fillRect(x - 60, F - 10, 120, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 60, F - 10, 120, 10);
  ctx.fillStyle = "#3b2416";
  ctx.fillRect(x - 70, F - 2, 5, 5);
  ctx.fillRect(x + 65, F - 2, 5, 5);
}

function drawCoffeeTable(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  groundShadow(ctx, x, F + 2, 48, 5, 0.22);
  roundRectPath(ctx, x - 46, T, 92, F - T - 6, 5);
  fillStroke(ctx, "#a66f42", 1.6);
  ctx.fillStyle = "#8b5a33";
  ctx.fillRect(x - 46, F - 8, 92, 8);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(x - 46, F - 8, 92, 8);
  // Tea, magazine, snacks
  for (const [cx, c] of [
    [-22, "#ffffff"],
    [-10, "#fde047"],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + cx, T + 11, 4, 0, Math.PI * 2);
    fillStroke(ctx, c, 1);
  }
  roundRectPath(ctx, x + 2, T + 5, 18, 12, 1);
  fillStroke(ctx, "#fca5a5", 1);
  ctx.beginPath();
  ctx.ellipse(x + 32, T + 11, 8, 5, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#fef3c7", 1);
}

function drawTrophyCase(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  const top = T - 46;
  groundShadow(ctx, x, F, 38, 5, 0.22);
  roundRectPath(ctx, x - 36, top, 72, F - top, 3);
  fillStroke(ctx, "#78350f", 1.6);
  ctx.fillStyle = "#cfeafd";
  ctx.fillRect(x - 31, top + 5, 62, F - top - 18);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(x - 31, top + 26, 62, 3);
  for (const tx of [-18, 0, 18]) {
    ctx.fillStyle = "#fbbf24";
    roundRectPath(ctx, x + tx - 4, top + 10, 8, 10, 2);
    fillStroke(ctx, "#fbbf24", 1);
    ctx.fillStyle = "#92400e";
    ctx.fillRect(x + tx - 3, top + 20, 6, 4);
  }
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(x - 24, top + 33, 14, 10);
  ctx.fillRect(x + 6, top + 33, 14, 10);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 26, top + 40);
  ctx.lineTo(x - 14, top + 8);
  ctx.stroke();
  ctx.fillStyle = "#5c3a1b";
  ctx.fillRect(x - 36, F - 10, 72, 10);
}

function drawPhoneTable(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  groundShadow(ctx, x, F, 28, 5, 0.2);
  roundRectPath(ctx, x - 26, T, 52, F - T - 8, 4);
  fillStroke(ctx, "#a66f42", 1.5);
  ctx.fillStyle = "#8b5a33";
  ctx.fillRect(x - 26, F - 10, 52, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - 26, F - 10, 52, 10);
  roundRectPath(ctx, x - 20, T - 8, 18, 14, 4);
  fillStroke(ctx, "#dc2626", 1.3);
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(x - 18, T - 11, 14, 4);
  roundRectPath(ctx, x + 2, T - 4, 18, 13, 1);
  fillStroke(ctx, "#fef3c7", 1.2);
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, F: number): void {
  groundShadow(ctx, x, F, 15, 4, 0.22);
  ctx.beginPath();
  ctx.moveTo(x - 11, F - 16);
  ctx.lineTo(x + 11, F - 16);
  ctx.lineTo(x + 8, F);
  ctx.lineTo(x - 8, F);
  ctx.closePath();
  fillStroke(ctx, "#c2410c", 1.5);
  ctx.fillStyle = "#9a3412";
  ctx.fillRect(x - 11, F - 16, 22, 3);
  for (const [dx, dy, r, rot] of [
    [-9, -26, 9, -0.6],
    [9, -27, 9, 0.6],
    [0, -36, 10, 0],
    [-4, -20, 7, -0.3],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x + dx, F + dy, r, r * 0.65, rot, 0, Math.PI * 2);
    fillStroke(ctx, "#22a34a", 1.3, "#14532d");
    ctx.strokeStyle = "#14532d";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + dx - Math.cos(rot) * r * 0.7, F + dy - Math.sin(rot) * r * 0.7);
    ctx.lineTo(x + dx + Math.cos(rot) * r * 0.7, F + dy + Math.sin(rot) * r * 0.7);
    ctx.stroke();
  }
}

function drawDumbbellRack(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  groundShadow(ctx, x, F, 52, 5, 0.22);
  // Two tiers
  roundRectPath(ctx, x - 50, T - 14, 100, 12, 2);
  fillStroke(ctx, "#374151", 1.4);
  roundRectPath(ctx, x - 50, T + 6, 100, 12, 2);
  fillStroke(ctx, "#374151", 1.4);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 48, T - 2, 4, F - T + 2);
  ctx.fillRect(x + 44, T - 2, 4, F - T + 2);
  const plateColors = ["#111827", "#dc2626", "#2563eb", "#111827", "#16a34a"];
  for (let tier = 0; tier < 2; tier++) {
    const ty = tier === 0 ? T - 12 : T + 8;
    for (let i = 0; i < 5; i++) {
      const dx = x - 40 + i * 20;
      const size = 3 + i * 0.5 + tier;
      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(dx - 2, ty + 3, 12, 2.5);
      ctx.fillStyle = plateColors[i];
      roundRectPath(ctx, dx - 4, ty + 4 - size, 4, size * 2, 1);
      fillStroke(ctx, plateColors[i], 0.8);
      roundRectPath(ctx, dx + 8, ty + 4 - size, 4, size * 2, 1);
      fillStroke(ctx, plateColors[i], 0.8);
    }
  }
}

function drawBenchPress(ctx: CanvasRenderingContext2D, x: number, T: number, F: number): void {
  groundShadow(ctx, x, F, 58, 7, 0.25);
  // Bench pad
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 40, F - 12, 4, 12);
  ctx.fillRect(x + 6, F - 12, 4, 12);
  roundRectPath(ctx, x - 50, T + 14, 70, 18, 6);
  fillStroke(ctx, "#b91c1c", 1.6);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x - 46, T + 17, 62, 3);
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(x - 50, T + 30, 70, 6);
  // Uprights
  ctx.fillStyle = "#374151";
  for (const uy of [T - 6, T + 30]) {
    ctx.fillRect(x + 26, uy - 16, 6, 22);
  }
  // Barbell across the uprights with plates
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 29, T - 26);
  ctx.lineTo(x + 29, F - 4);
  ctx.stroke();
  for (const py of [T - 22, F - 10]) {
    ctx.beginPath();
    ctx.ellipse(x + 29, py, 11, 4.5, 0, 0, Math.PI * 2);
    fillStroke(ctx, "#111827", 1.4);
    ctx.beginPath();
    ctx.ellipse(x + 29, py, 3, 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#6b7280";
    ctx.fill();
  }
  // Water bottle & towel
  roundRectPath(ctx, x + 44, F - 18, 7, 14, 2);
  fillStroke(ctx, "#38bdf8", 1.1);
  roundRectPath(ctx, x - 48, T + 2, 18, 10, 2);
  fillStroke(ctx, "#f8fafc", 1);
}

function drawTreadmill(
  ctx: CanvasRenderingContext2D,
  x: number,
  T: number,
  F: number,
  time: number,
): void {
  groundShadow(ctx, x, F, 24, 5, 0.22);
  // Console at the top
  roundRectPath(ctx, x - 22, T - 22, 44, 18, 3);
  fillStroke(ctx, "#1f2937", 1.5);
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(x - 12, T - 18, 24, 8);
  ctx.fillStyle = "#374151";
  ctx.fillRect(x - 21, T - 4, 4, 30);
  ctx.fillRect(x + 17, T - 4, 4, 30);
  // Belt
  roundRectPath(ctx, x - 18, T + 2, 36, F - T - 4, 4);
  fillStroke(ctx, "#4b5563", 1.5);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 14, T + 6, 28, F - T - 14);
  const off = (time * 0.04) % 12;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let by = T + 6 + off; by < F - 8; by += 12) {
    ctx.fillRect(x - 14, by, 28, 2);
  }
  ctx.fillStyle = "#374151";
  ctx.fillRect(x - 18, F - 8, 36, 8);
}

function drawDoormat(ctx: CanvasRenderingContext2D, x: number, F: number, time: number): void {
  roundRectPath(ctx, x - 42, F - 24, 84, 24, 5);
  fillStroke(ctx, "#b45309", 2, "#451a03");
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 36, F - 19, 72, 14);
  const bob = Math.sin(time * 0.005) * 2;
  ctx.font = "800 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff8e7";
  ctx.fillText("▼ KELUAR", x, F - 12 + bob);
}

// ----------------------------------------------------------------------------
// Cats
// ----------------------------------------------------------------------------

export function drawCat(
  w: WorldRenderContext,
  cat: CatData,
  state: CatRuntimeState,
  nearPlayer: boolean,
): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = state.x - cameraX;
  const y = state.y - cameraY;
  const hop = state.moving ? Math.abs(Math.sin(time * 0.014)) * 2 : 0;
  const wag = Math.sin(time * 0.006 + cat.homeX) * 4;
  const dir = state.facing === "left" ? -1 : 1;
  const S = 1.15;

  groundShadow(ctx, x, y + 1, 15, 4.5, 0.22);

  ctx.save();
  ctx.translate(x, y - hop);
  ctx.scale(dir * S, S);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Tail (outline pass then color pass)
  const tail = () => {
    ctx.beginPath();
    ctx.moveTo(-10, -9);
    ctx.quadraticCurveTo(-20, -11, -17 + wag * 0.4, -24);
  };
  tail();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.stroke();
  tail();
  ctx.strokeStyle = cat.tailColor;
  ctx.lineWidth = 3.6;
  ctx.stroke();
  if (cat.tailTip) {
    ctx.beginPath();
    ctx.arc(-17 + wag * 0.4, -23.5, 1.9, 0, Math.PI * 2);
    ctx.fillStyle = cat.tailTip;
    ctx.fill();
  }

  // Legs with white paws
  const step = state.moving ? Math.sin(time * 0.02) * 1.5 : 0;
  for (const [lx, ph] of [
    [-8, 1],
    [-3.5, -1],
    [4, -1],
    [8.5, 1],
  ] as const) {
    const lift = Math.max(0, step * ph);
    roundRectPath(ctx, lx - 2, -7, 4, 7 - lift, 1.8);
    fillStroke(ctx, cat.coat, 1.1);
    ctx.beginPath();
    ctx.ellipse(lx, -1 - lift, 2.4, 1.6, 0, 0, Math.PI * 2);
    fillStroke(ctx, cat.belly, 1);
  }

  // Body with clipped patches
  const bodyPath = () => {
    ctx.beginPath();
    ctx.ellipse(0, -10, 12.5, 7.5, 0, 0, Math.PI * 2);
  };
  bodyPath();
  ctx.fillStyle = cat.coat;
  ctx.fill();
  ctx.save();
  bodyPath();
  ctx.clip();
  for (const p of cat.patches) {
    if (p.part !== "body") continue;
    ctx.beginPath();
    ctx.ellipse(p.x, -10 + p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(4, -4.5, 8, 3.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = cat.belly;
  ctx.fill();
  ctx.restore();
  bodyPath();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Head
  const hx = 10;
  const hy = -18;
  for (const [i, ex] of [
    [0, -4.6],
    [1, 4.6],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(hx + ex - 3.4, hy - 4);
    ctx.lineTo(hx + ex * 1.05, hy - 12);
    ctx.lineTo(hx + ex + 3.4, hy - 4);
    ctx.closePath();
    fillStroke(ctx, cat.earColors[i], 1.2);
    ctx.beginPath();
    ctx.moveTo(hx + ex - 1.6, hy - 5);
    ctx.lineTo(hx + ex * 1.05, hy - 9.5);
    ctx.lineTo(hx + ex + 1.6, hy - 5);
    ctx.closePath();
    ctx.fillStyle = cat.earInner;
    ctx.fill();
  }
  const headPath = () => {
    ctx.beginPath();
    ctx.ellipse(hx, hy, 8.6, 7.6, 0, 0, Math.PI * 2);
  };
  headPath();
  ctx.fillStyle = cat.coat;
  ctx.fill();
  ctx.save();
  headPath();
  ctx.clip();
  for (const p of cat.patches) {
    if (p.part !== "head") continue;
    ctx.beginPath();
    ctx.ellipse(hx + p.x, hy + p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  if (cat.muzzle) {
    // White blaze + muzzle for bicolor cats
    ctx.beginPath();
    ctx.moveTo(hx - 1.6, hy - 8);
    ctx.lineTo(hx + 1.6, hy - 8);
    ctx.lineTo(hx + 3.5, hy + 1);
    ctx.lineTo(hx - 3.5, hy + 1);
    ctx.closePath();
    ctx.fillStyle = cat.muzzle;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx, hy + 4, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  headPath();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Collar + bell
  ctx.strokeStyle = cat.collarColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(hx, hy, 7.4, Math.PI * 0.28, Math.PI * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx, hy + 8.2, 1.6, 0, Math.PI * 2);
  fillStroke(ctx, "#facc15", 0.8);

  // Face
  const blink = (time + cat.homeX * 13) % 3600 < 140;
  for (const ex of [-3, 3]) {
    if (blink) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + ex - 1.6, hy - 0.5);
      ctx.lineTo(hx + ex + 1.6, hy - 0.5);
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    ctx.ellipse(hx + ex, hy - 0.5, 1.8, 2.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = cat.eyeColor;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + ex, hy - 0.5, 0.7, 1.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(hx + ex - 0.9, hy - 1.9, 0.9, 0.9);
  }
  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.moveTo(hx - 1.2, hy + 2);
  ctx.lineTo(hx + 1.2, hy + 2);
  ctx.lineTo(hx, hy + 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(hx, hy + 3.2);
  ctx.quadraticCurveTo(hx - 1, hy + 4.6, hx - 2.2, hy + 4);
  ctx.moveTo(hx, hy + 3.2);
  ctx.quadraticCurveTo(hx + 1, hy + 4.6, hx + 2.2, hy + 4);
  ctx.stroke();
  ctx.strokeStyle = "rgba(46, 33, 27, 0.45)";
  ctx.lineWidth = 0.6;
  for (const side of [-1, 1]) {
    for (const dy of [-0.6, 0.8]) {
      ctx.beginPath();
      ctx.moveTo(hx + side * 4, hy + 3 + dy);
      ctx.lineTo(hx + side * 10, hy + 2 + dy * 2);
      ctx.stroke();
    }
  }

  ctx.restore();

  if (nearPlayer) {
    ctx.font = "800 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const label = `${cat.name} ${cat.gender === "jantan" ? "♂" : "♀"}`;
    const tw = ctx.measureText(label).width + 10;
    roundRectPath(ctx, x - tw / 2, y + 5, tw, 13, 6);
    fillStroke(ctx, "#fff8e7", 1.1, "#5b3a29");
    ctx.fillStyle = "#3b2a1a";
    ctx.fillText(label, x, y + 7);

    const meowIdx = Math.floor(time / 1800) % cat.meows.length;
    drawSpeechBubble(ctx, x, y - 36, cat.meows[meowIdx], time);
  }
}
