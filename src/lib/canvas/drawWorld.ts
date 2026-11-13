import {
  ROAD_WIDTH,
  TOWN_ZONES,
  type DecorItem,
  type GateConfig,
  type TownZone,
  type VehicleType,
} from "@/data/worldData";
import { drawVehicleSprite } from "./drawDriving";
import { fillStroke, groundShadow, roundRectPath } from "./shapes";
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

export function drawWorldGround(
  w: WorldRenderContext,
  zone: TownZone,
  vehicle: VehicleType,
  nearGate: GateConfig | null,
  nearParking: boolean,
): void {
  const { ctx, cameraX, cameraY, viewW, viewH, time } = w;
  const pat = getPatterns(ctx);
  const cfg = TOWN_ZONES[zone];

  // Dense forest outside the map
  ctx.fillStyle = "#2f6a35";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.fillStyle = anchor(pat.grass, cameraX, cameraY);
  ctx.fillRect(-cameraX, -cameraY, cfg.width, cfg.height);

  drawHedgeBorder(w, cfg.width, cfg.height, !!cfg.leftGate, !!cfg.rightGate);
  if (cfg.garden) {
    drawFlowerGarden(w, cfg.garden, time);
  }
  if (cfg.pond) {
    drawPond(w, cfg.pond, time);
  }
  drawRoad(w, cfg.road, !!cfg.leftGate, !!cfg.rightGate);
  drawParkingLot(w, cfg.parkingSpot, vehicle, nearParking, time);

  if (cfg.leftGate) {
    drawHighwayGate(w, cfg.leftGate, nearGate?.toZone === cfg.leftGate.toZone, time);
  }
  if (cfg.rightGate) {
    drawHighwayGate(w, cfg.rightGate, nearGate?.toZone === cfg.rightGate.toZone, time);
  }
}

function drawHedgeBorder(
  w: WorldRenderContext,
  width: number,
  height: number,
  openLeft: boolean,
  openRight: boolean,
): void {
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
  for (let x = 0; x <= width; x += step) {
    hedge(x, 4);
    hedge(x, height - 2);
  }
  for (let y = 0; y <= height; y += step) {
    if (!(openLeft && Math.abs(y - 350) < 42)) {
      hedge(2, y);
    }
    if (!(openRight && Math.abs(y - 350) < 42)) {
      hedge(width - 2, y);
    }
  }
}

function roadPath(
  ctx: CanvasRenderingContext2D,
  roadPts: { x: number; y: number }[],
  cameraX: number,
  cameraY: number,
): void {
  ctx.beginPath();
  ctx.moveTo(roadPts[0].x - cameraX, roadPts[0].y - cameraY);
  for (let i = 1; i < roadPts.length; i++) {
    ctx.lineTo(roadPts[i].x - cameraX, roadPts[i].y - cameraY);
  }
}

function drawRoad(
  w: WorldRenderContext,
  roadPts: { x: number; y: number }[],
  openLeft: boolean,
  openRight: boolean,
): void {
  const { ctx, cameraX, cameraY } = w;
  const pat = getPatterns(ctx);

  ctx.save();
  ctx.lineJoin = "miter";
  ctx.miterLimit = 6;
  ctx.lineCap = "butt";

  roadPath(ctx, roadPts, cameraX, cameraY);

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

  // Rounded plaza at dead-end road tips
  const caps: { x: number; y: number }[] = [];
  if (!openLeft) caps.push(roadPts[0]);
  if (!openRight) caps.push(roadPts[roadPts.length - 1]);

  for (const p of caps) {
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y - cameraY, ROAD_WIDTH / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = anchor(pat.curb, cameraX, cameraY);
    ctx.fill();
    ctx.strokeStyle = "#3c3833";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawHighwayGate(
  w: WorldRenderContext,
  gate: GateConfig,
  highlighted: boolean,
  time: number,
): void {
  const { ctx, cameraX, cameraY } = w;
  const gx = gate.x - cameraX;
  const gy = gate.y - cameraY;
  const isRight = gate.direction === "right";
  const pulse = 0.65 + Math.sin(time * 0.006) * 0.35;

  // Glowing arrows on asphalt pointing toward the highway exit
  ctx.save();
  ctx.fillStyle = highlighted
    ? `rgba(250, 204, 21, ${0.85 + pulse * 0.15})`
    : `rgba(254, 240, 138, ${0.45 + pulse * 0.3})`;
  for (let i = 0; i < 2; i++) {
    const offset = (isRight ? -1 : 1) * (i * 18 - 4);
    const ax = gx + offset;
    const dir = isRight ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(ax - 6 * dir, gy - 9);
    ctx.lineTo(ax + 6 * dir, gy);
    ctx.lineTo(ax - 6 * dir, gy + 9);
    ctx.lineTo(ax - 2 * dir, gy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Highway gantry / green road sign on the south side of the road (away from buildings & NPCs)
  const signX = gx + (isRight ? -24 : 24);
  const signY = gy + 50;
  groundShadow(ctx, signX, signY + 10, 14, 5, 0.22);

  // Sign posts
  roundRectPath(ctx, signX - 24, signY - 14, 4, 24, 1);
  fillStroke(ctx, "#64748b", 1.2, "#1e293b");
  roundRectPath(ctx, signX + 20, signY - 14, 4, 24, 1);
  fillStroke(ctx, "#64748b", 1.2, "#1e293b");

  // Green toll/highway board
  ctx.font = "800 9px ui-sans-serif, system-ui, sans-serif";
  const labelW = Math.max(88, ctx.measureText(gate.label).width + 18);
  roundRectPath(ctx, signX - labelW / 2, signY - 28, labelW, 19, 5);
  fillStroke(
    ctx,
    highlighted ? "#15803d" : "#166534",
    highlighted ? 2.2 : 1.6,
    highlighted ? "#facc15" : "#bbf7d0",
  );

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(gate.label, signX, signY - 18.5);
}

function drawParkingLot(
  w: WorldRenderContext,
  spot: { x: number; y: number },
  selectedVehicle: VehicleType,
  nearParking: boolean,
  time: number,
): void {
  const { ctx, cameraX, cameraY } = w;
  const pat = getPatterns(ctx);
  const px = spot.x - cameraX;
  const py = spot.y - cameraY;
  const lotW = 152;
  const lotH = 66;

  // Connector driveway to main road (y=350)
  ctx.fillStyle = anchor(pat.asphalt, cameraX, cameraY);
  ctx.fillRect(px - 22, 350 - cameraY, 44, py - (350 - cameraY));

  // Parking pad
  roundRectPath(ctx, px - lotW / 2, py - lotH / 2, lotW, lotH, 9);
  fillStroke(
    ctx,
    anchor(pat.asphalt, cameraX, cameraY),
    nearParking ? 2.5 : 1.8,
    nearParking ? "#facc15" : "#4b5563",
  );

  // Parking bay lines
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 1.6;
  ctx.strokeRect(px - lotW / 2 + 8, py - lotH / 2 + 8, 64, lotH - 16);
  ctx.strokeRect(px + 4, py - lotH / 2 + 8, 64, lotH - 16);

  // Signboard "P GARASI / PARKIR"
  roundRectPath(ctx, px - 58, py + lotH / 2 + 4, 116, 17, 5);
  fillStroke(ctx, "#1e3a8a", 1.5, "#93c5fd");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🅿️ GARASI · MOBIL / MOTOR", px, py + lotH / 2 + 12.5);

  // Draw parked Car (left bay) & Moto (right bay)
  drawVehicleSprite(ctx, px - 36, py + 4, "car", {
    direction: 1,
    moving: false,
    scale: 0.76,
    showDriver: false,
    selected: selectedVehicle === "car",
    time,
  });

  drawVehicleSprite(ctx, px + 36, py + 4, "moto", {
    direction: 1,
    moving: false,
    scale: 0.85,
    showDriver: false,
    selected: selectedVehicle === "moto",
    time,
  });
}

function drawPond(
  w: WorldRenderContext,
  pond: { x: number; y: number; rx: number; ry: number },
  time: number,
): void {
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

  // Signboard under pond
  roundRectPath(ctx, cx - 50, cy + pond.ry + 13, 100, 16, 5);
  fillStroke(ctx, "#0e5c8c", 1.4, "#bae6fd");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 8.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐟 KOLAM IKAN KOI", cx, cy + pond.ry + 21);
}

function drawFlowerGarden(
  w: WorldRenderContext,
  garden: { x: number; y: number; width: number; height: number },
  time: number,
): void {
  const { ctx, cameraX, cameraY } = w;
  const pat = getPatterns(ctx);
  const gx = garden.x - cameraX;
  const gy = garden.y - cameraY;
  const gw = garden.width;
  const gh = garden.height;
  const left = gx - gw / 2;
  const top = gy - gh / 2;

  // Stone path border & base
  roundRectPath(ctx, left - 4, top - 4, gw + 8, gh + 8, 12);
  fillStroke(ctx, anchor(pat.curb, cameraX, cameraY), 2, "#5c554a");

  // Inner garden grass
  roundRectPath(ctx, left + 2, top + 2, gw - 4, gh - 4, 9);
  fillStroke(ctx, "#68b849", 1.2, "#4a8c32");

  // Stone cross-path in the center
  ctx.fillStyle = "#d6cfc2";
  ctx.fillRect(gx - 9, top + 2, 18, gh - 4);
  ctx.fillRect(left + 2, gy - 7, gw - 4, 14);

  // 4 rich soil flowerbeds in the quadrants
  const bedW = (gw - 32) / 2;
  const bedH = (gh - 28) / 2;
  const beds: [number, number, string[]][] = [
    [left + 6, top + 6, ["#f43f5e", "#fb7185", "#fda4af"]], // Red/pink roses
    [gx + 10, top + 6, ["#facc15", "#fde047", "#fb923c"]], // Sunflowers/marigolds
    [left + 6, gy + 8, ["#a855f7", "#c084fc", "#f472b6"]], // Lavender/tulips
    [gx + 10, gy + 8, ["#38bdf8", "#60a5fa", "#ffffff"]], // Bluebells/daisies
  ];

  for (const [bx, by, palette] of beds) {
    roundRectPath(ctx, bx, by, bedW, bedH, 5);
    fillStroke(ctx, "#6b4423", 1.4, "#432812");

    // Rows of blooming flowers inside each bed
    const cols = 5;
    const rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const fx = bx + 8 + (c * (bedW - 16)) / (cols - 1);
        const fy = by + 7 + r * (bedH - 13);
        const sway = Math.sin(time * 0.003 + c * 0.8 + r) * 0.8;

        // Leaves
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(fx - 2, fy + 1, 2.2, 0, Math.PI * 2);
        ctx.arc(fx + 2, fy + 1, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Petals
        ctx.fillStyle = palette[(c + r) % palette.length];
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + sway + Math.cos(a) * 2.4, fy - 1 + Math.sin(a) * 2.4, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Flower center
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(fx + sway, fy - 1, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cozy wooden garden bench at the top center of the garden
  roundRectPath(ctx, gx - 20, top - 9, 40, 10, 2);
  fillStroke(ctx, "#b45309", 1.4, "#451a03");
  ctx.fillStyle = "#d97706";
  ctx.fillRect(gx - 18, top - 6, 36, 3);

  // Fluttering butterflies
  for (let i = 0; i < 2; i++) {
    const t = time * 0.0018 + i * 3.1;
    const bx = gx + Math.cos(t) * (gw * 0.32);
    const by = gy + Math.sin(t * 1.5) * (gh * 0.28) - 6;
    const wing = Math.abs(Math.sin(time * 0.015 + i)) * 3.5 + 1;
    ctx.fillStyle = i === 0 ? "#f472b6" : "#facc15";
    ctx.beginPath();
    ctx.ellipse(bx - 2, by, wing, 2.2, -0.3, 0, Math.PI * 2);
    ctx.ellipse(bx + 2, by, wing, 2.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Signboard under garden
  roundRectPath(ctx, gx - 48, top + gh + 7, 96, 16, 5);
  fillStroke(ctx, "#15803d", 1.4, "#bbf7d0");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 8.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌸 TAMAN BUNGA", gx, top + gh + 15);
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
