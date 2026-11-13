import { TOWN_ZONES, type TownZone, type VehicleType } from "@/data/worldData";
import { fillStroke, groundShadow, roundRectPath } from "./shapes";

export interface HighwayTrafficItem {
  id: number;
  x: number;
  lane: 0 | 1 | 2;
  color: string;
  speed: number;
}

export interface HighwayBoostPad {
  id: number;
  x: number;
  lane: 0 | 1 | 2;
  collected?: boolean;
}

export interface DrivingRuntimeState {
  fromZone: TownZone;
  toZone: TownZone;
  vehicle: VehicleType;
  mode: "manual" | "auto";
  direction: 1 | -1;
  /** 0 .. totalDistance */
  distance: number;
  totalDistance: number;
  /** Vertical position on the 3-lane road (-1 .. 1) */
  laneY: number;
  speed: number;
  boosting: number;
  honkTimer: number;
  scrollX: number;
  traffic: HighwayTrafficItem[];
  boostPads: HighwayBoostPad[];
}

export function drawVehicleSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vehicle: VehicleType,
  opts?: {
    direction?: 1 | -1;
    moving?: boolean;
    boosting?: boolean;
    time?: number;
    scale?: number;
    showDriver?: boolean;
    selected?: boolean;
  },
): void {
  const dir = opts?.direction ?? 1;
  const moving = opts?.moving ?? false;
  const boosting = opts?.boosting ?? false;
  const time = opts?.time ?? 0;
  const scale = opts?.scale ?? 1;
  const showDriver = opts?.showDriver ?? true;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * scale, scale);

  const bounce = moving ? Math.sin(time * 0.03) * 1.4 : 0;
  const wheelSpin = moving ? (time * 0.025) % (Math.PI * 2) : 0;

  if (opts?.selected) {
    ctx.save();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.ellipse(0, 2, vehicle === "car" ? 38 : 28, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (vehicle === "car") {
    groundShadow(ctx, 0, 5, 34, 10, 0.28);

    // Exhaust / turbo flame
    if (moving) {
      const pCount = boosting ? 5 : 3;
      for (let i = 0; i < pCount; i++) {
        const p = ((time * 0.006 + i * 0.25) % 1);
        const px = -34 - p * (boosting ? 26 : 16);
        const py = -4 + Math.sin(time * 0.02 + i * 2) * 3;
        ctx.fillStyle = boosting
          ? i % 2 === 0
            ? "#38bdf8"
            : "#f97316"
          : `rgba(203, 213, 225, ${0.75 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(px, py, (boosting ? 5 : 3.5) * (1 - p * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(0, bounce);

    // Headlight beam when moving
    if (moving) {
      const grad = ctx.createLinearGradient(30, -8, 95, -8);
      grad.addColorStop(0, "rgba(254, 240, 138, 0.45)");
      grad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(30, -10);
      ctx.lineTo(95, -24);
      ctx.lineTo(95, 8);
      ctx.lineTo(30, -2);
      ctx.closePath();
      ctx.fill();
    }

    // Lower car body (sporty red sedan)
    roundRectPath(ctx, -32, -16, 64, 16, 6);
    fillStroke(ctx, "#ef4444", 1.8, "#2b1d14");

    // Side stripe
    ctx.fillStyle = "#fca5a5";
    ctx.fillRect(-26, -8, 52, 2.5);

    // Cabin / roof
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.lineTo(-12, -29);
    ctx.lineTo(14, -29);
    ctx.lineTo(23, -16);
    ctx.closePath();
    fillStroke(ctx, "#dc2626", 1.8, "#2b1d14");

    // Windows
    ctx.beginPath();
    ctx.moveTo(-16, -17);
    ctx.lineTo(-10, -26.5);
    ctx.lineTo(12, -26.5);
    ctx.lineTo(19, -17);
    ctx.closePath();
    fillStroke(ctx, "#bae6fd", 1.3, "#1e293b");

    // Driver silhouette / Azzam inside cabin
    if (showDriver) {
      // Head
      ctx.fillStyle = "#f6cfa8";
      ctx.beginPath();
      ctx.arc(3, -21, 4.2, 0, Math.PI * 2);
      ctx.fill();
      // Hair
      ctx.fillStyle = "#3b2618";
      ctx.beginPath();
      ctx.arc(2.5, -22.5, 4.3, Math.PI, 0);
      ctx.fill();
    }

    // Center window pillar
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1, -26.5);
    ctx.lineTo(-1, -17);
    ctx.stroke();

    // Headlight & Taillight
    roundRectPath(ctx, 27, -13, 5, 5, 1.5);
    fillStroke(ctx, "#fef08a", 1, "#713f12");
    roundRectPath(ctx, -32, -13, 4, 5, 1.2);
    fillStroke(ctx, "#fb7185", 1, "#881337");

    // Bumpers
    roundRectPath(ctx, -34, -5, 8, 4, 1.5);
    fillStroke(ctx, "#334155", 1.2, "#0f172a");
    roundRectPath(ctx, 26, -5, 8, 4, 1.5);
    fillStroke(ctx, "#334155", 1.2, "#0f172a");

    ctx.restore();

    // Wheels
    for (const wx of [-19, 19]) {
      ctx.save();
      ctx.translate(wx, 0);
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      fillStroke(ctx, "#1e293b", 1.6, "#0f172a");
      ctx.rotate(wheelSpin);
      ctx.beginPath();
      ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
      fillStroke(ctx, "#cbd5e1", 1, "#475569");
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3.5, 0);
      ctx.lineTo(3.5, 0);
      ctx.moveTo(0, -3.5);
      ctx.lineTo(0, 3.5);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // MOTORCYCLE ("moto")
    groundShadow(ctx, 0, 5, 24, 8, 0.26);

    if (moving) {
      const pCount = boosting ? 5 : 3;
      for (let i = 0; i < pCount; i++) {
        const p = ((time * 0.007 + i * 0.25) % 1);
        const px = -24 - p * (boosting ? 24 : 14);
        const py = -3 + Math.sin(time * 0.025 + i * 2) * 2.5;
        ctx.fillStyle = boosting
          ? i % 2 === 0
            ? "#38bdf8"
            : "#facc15"
          : `rgba(226, 232, 240, ${0.75 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(px, py, (boosting ? 4.5 : 3) * (1 - p * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(0, bounce);

    if (moving) {
      const grad = ctx.createLinearGradient(20, -12, 80, -12);
      grad.addColorStop(0, "rgba(254, 240, 138, 0.45)");
      grad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(20, -14);
      ctx.lineTo(80, -24);
      ctx.lineTo(80, 2);
      ctx.lineTo(20, -8);
      ctx.closePath();
      ctx.fill();
    }

    // Exhaust pipe
    roundRectPath(ctx, -22, -6, 16, 4, 1.5);
    fillStroke(ctx, "#94a3b8", 1.2, "#1e293b");

    // Rear & main frame (cyan sport scooter/motorbike)
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(-6, -16);
    ctx.lineTo(8, -10);
    ctx.lineTo(14, -20);
    ctx.lineTo(20, -18);
    ctx.lineTo(14, -4);
    ctx.lineTo(-14, -4);
    ctx.closePath();
    fillStroke(ctx, "#06b6d4", 1.6, "#0f172a");

    // Seat
    roundRectPath(ctx, -14, -17, 14, 5, 2.5);
    fillStroke(ctx, "#1e293b", 1.2, "#0f172a");

    // Handlebar & headlight
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(14, -20);
    ctx.lineTo(10, -25);
    ctx.stroke();

    roundRectPath(ctx, 17, -19, 5, 5, 2);
    fillStroke(ctx, "#fef08a", 1.2, "#713f12");

    // Rider (Azzam with helmet)
    if (showDriver) {
      // Torso leaning slightly forward
      roundRectPath(ctx, -8, -28, 10, 12, 3);
      fillStroke(ctx, "#2f8f6b", 1.3, "#14532d");
      // Arm reaching handlebar
      ctx.strokeStyle = "#2f8f6b";
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(10, -23);
      ctx.stroke();
      // Helmet
      ctx.beginPath();
      ctx.arc(-2, -33, 6.2, 0, Math.PI * 2);
      fillStroke(ctx, "#facc15", 1.4, "#713f12");
      // Visor
      roundRectPath(ctx, 0, -35, 5, 4, 1.5);
      fillStroke(ctx, "#0f172a", 1, "#334155");
    }

    ctx.restore();

    // Wheels
    for (const wx of [-15, 16]) {
      ctx.save();
      ctx.translate(wx, 0);
      ctx.beginPath();
      ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
      fillStroke(ctx, "#1e293b", 1.6, "#0f172a");
      ctx.rotate(wheelSpin);
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      fillStroke(ctx, "#e2e8f0", 1, "#475569");
      ctx.restore();
    }
  }

  ctx.restore();
}

export function drawDrivingScene(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  state: DrivingRuntimeState,
  time: number,
): void {
  const progress = Math.min(1, Math.max(0, state.distance / state.totalDistance));
  const roadCenterY = Math.floor(viewH * 0.56);
  const roadH = 190;
  const roadTop = roadCenterY - roadH / 2;
  const roadBottom = roadCenterY + roadH / 2;

  // 1. Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, roadTop - 40);
  sky.addColorStop(0, "#38bdf8");
  sky.addColorStop(1, "#bae6fd");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, roadTop);

  // Parallax clouds
  const cloudScroll = (state.scrollX * 0.15) % (viewW + 260);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 240 - cloudScroll * state.direction + viewW * 2) % (viewW + 240)) - 120;
    const cy = 48 + (i % 3) * 28;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy - 5, 26, 0, Math.PI * 2);
    ctx.arc(cx + 38, cy + 2, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant rolling hills
  const hillScroll = (state.scrollX * 0.3) % 400;
  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.moveTo(0, roadTop);
  for (let x = -400; x <= viewW + 400; x += 200) {
    const hx = x - hillScroll * state.direction;
    ctx.quadraticCurveTo(hx + 100, roadTop - 95, hx + 200, roadTop);
  }
  ctx.lineTo(viewW, roadTop);
  ctx.closePath();
  ctx.fill();

  // 2. Roadside grass (top & bottom of highway)
  ctx.fillStyle = "#74bf55";
  ctx.fillRect(0, roadTop - 55, viewW, 55);
  ctx.fillRect(0, roadBottom, viewW, viewH - roadBottom);

  // Scrolling roadside trees & lamps along top & bottom verges
  const propStep = 150;
  const propOffset = state.scrollX % propStep;
  for (let x = -propStep; x < viewW + propStep; x += propStep) {
    const px = x - propOffset * state.direction;
    const idx = Math.abs(Math.round((x + state.scrollX) / propStep));
    // Top side trees & highway lamps
    drawRoadsideTree(ctx, px, roadTop - 18, idx % 2 === 0);
    drawHighwayLamp(ctx, px + 75, roadTop - 10);
  }

  // 3. Highway Asphalt (3 lanes)
  ctx.fillStyle = "#3c3833";
  ctx.fillRect(0, roadTop - 8, viewW, roadH + 16);
  ctx.fillStyle = "#b7b0a3";
  ctx.fillRect(0, roadTop - 6, viewW, 6);
  ctx.fillRect(0, roadBottom, viewW, 6);

  ctx.fillStyle = "#475569";
  ctx.fillRect(0, roadTop, viewW, roadH);

  // Top & bottom solid edge lines
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, roadTop + 6, viewW, 3);
  ctx.fillRect(0, roadBottom - 9, viewW, 3);

  // Scrolling lane dividers (3 lanes)
  const laneH = roadH / 3;
  const dashStep = 64;
  const dashOffset = (state.scrollX * state.direction) % dashStep;
  ctx.fillStyle = "#facc15";
  for (let lane = 1; lane <= 2; lane++) {
    const ly = roadTop + lane * laneH;
    for (let x = -dashStep; x < viewW + dashStep; x += dashStep) {
      ctx.fillRect(x - dashOffset, ly - 2, 34, 4);
    }
  }

  // 4. Boost pads on the road
  const playerScreenX =
    state.direction === 1 ? Math.floor(viewW * 0.28) : Math.floor(viewW * 0.72);

  for (const pad of state.boostPads) {
    if (pad.collected) continue;
    const sx = playerScreenX + (pad.x - state.distance) * state.direction;
    if (sx < -60 || sx > viewW + 60) continue;
    const sy = roadTop + (pad.lane + 0.5) * laneH;

    ctx.save();
    roundRectPath(ctx, sx - 22, sy - 12, 44, 24, 5);
    fillStroke(ctx, "rgba(56, 189, 248, 0.85)", 1.6, "#fde047");
    ctx.fillStyle = "#fef08a";
    ctx.font = "900 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡ GAS", sx, sy);
    ctx.restore();
  }

  // 5. Traffic cars & Player vehicle sorted by Y
  const playerY = roadCenterY + state.laneY * (roadH * 0.34);

  const renderables: { y: number; draw: () => void }[] = [];

  for (const t of state.traffic) {
    const sx = playerScreenX + (t.x - state.distance) * state.direction;
    if (sx < -80 || sx > viewW + 80) continue;
    const sy = roadTop + (t.lane + 0.5) * laneH;
    renderables.push({
      y: sy,
      draw: () => drawTrafficCar(ctx, sx, sy, t.color, state.direction, time),
    });
  }

  renderables.push({
    y: playerY,
    draw: () => {
      drawVehicleSprite(ctx, playerScreenX, playerY, state.vehicle, {
        direction: state.direction,
        moving: true,
        boosting: state.boosting > 0,
        time,
        scale: 1.35,
        showDriver: true,
      });

      if (state.honkTimer > 0) {
        roundRectPath(ctx, playerScreenX - 38, playerY - 62, 76, 22, 8);
        fillStroke(ctx, "#fef08a", 2, "#713f12");
        ctx.fillStyle = "#713f12";
        ctx.font = "800 11px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TIN! TIN! 📯", playerScreenX, playerY - 51);
      }
    },
  });

  renderables.sort((a, b) => a.y - b.y);
  for (const r of renderables) r.draw();

  // Foreground bottom trees
  for (let x = -propStep; x < viewW + propStep; x += propStep) {
    const px = x - propOffset * state.direction + 40;
    const idx = Math.abs(Math.round((x + state.scrollX) / propStep));
    drawRoadsideTree(ctx, px, roadBottom + 42, idx % 2 !== 0);
  }

  // 6. Top Highway Progress Dashboard
  const fromCfg = TOWN_ZONES[state.fromZone];
  const toCfg = TOWN_ZONES[state.toZone];
  const cardW = Math.min(500, viewW - 32);
  const cardX = (viewW - cardW) / 2;
  const cardY = 18;

  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, 74, 10);
  fillStroke(ctx, "rgba(255, 248, 231, 0.96)", 3, "#5b3a29");

  ctx.fillStyle = "#3b2618";
  ctx.font = "800 13px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const vBadge = state.vehicle === "car" ? "🚗 Naik Mobil" : "🏍️ Naik Motor";
  ctx.fillText(`${vBadge} — Menuju ${toCfg.shortLabel}`, viewW / 2, cardY + 10);

  // Progress bar
  const barX = cardX + 24;
  const barW = cardW - 48;
  const barY = cardY + 34;
  roundRectPath(ctx, barX, barY, barW, 12, 6);
  fillStroke(ctx, "#e5d5b5", 1.5, "#7a4a2a");

  const fillW = Math.max(12, barW * progress);
  roundRectPath(ctx, barX, barY, fillW, 12, 6);
  ctx.fillStyle = state.boosting > 0 ? "#38bdf8" : "#22c55e";
  ctx.fill();

  // Mini vehicle icon on progress bar
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.vehicle === "car" ? "🚗" : "🏍️", barX + fillW, barY + 6);

  // Instructions at bottom of card
  ctx.fillStyle = "#6b4f3a";
  ctx.font = "700 10.5px ui-sans-serif, system-ui, sans-serif";
  const hint =
    state.mode === "manual"
      ? `${fromCfg.shortLabel} ➔ ${toCfg.shortLabel} (${Math.round(progress * 100)}%) · WASD/Panah: Setir & Gas · Space: Klakson`
      : `Perjalanan otomatis ke ${toCfg.shortLabel} (${Math.round(progress * 100)}%) · WASD: Ambil Alih Setir`;
  ctx.fillText(hint, viewW / 2, cardY + 54);
  ctx.restore();
}

function drawTrafficCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  dir: 1 | -1,
  time: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * 1.15, 1.15);
  groundShadow(ctx, 0, 5, 28, 9, 0.24);
  const bob = Math.sin(time * 0.025 + x) * 0.8;
  ctx.translate(0, bob);
  roundRectPath(ctx, -26, -14, 52, 14, 5);
  fillStroke(ctx, color, 1.6, "#1e293b");
  roundRectPath(ctx, -15, -24, 28, 11, 4);
  fillStroke(ctx, color, 1.5, "#1e293b");
  roundRectPath(ctx, -12, -22, 22, 8, 2.5);
  fillStroke(ctx, "#bae6fd", 1, "#1e293b");
  for (const wx of [-15, 15]) {
    ctx.beginPath();
    ctx.arc(wx, 0, 6, 0, Math.PI * 2);
    fillStroke(ctx, "#1e293b", 1.4, "#0f172a");
  }
  ctx.restore();
}

function drawRoadsideTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isPine: boolean,
): void {
  groundShadow(ctx, x, y + 2, 18, 6, 0.2);
  roundRectPath(ctx, x - 4, y - 20, 8, 22, 2);
  fillStroke(ctx, "#7a4a26", 1.4);
  if (isPine) {
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 12);
    ctx.lineTo(x, y - 48);
    ctx.lineTo(x + 18, y - 12);
    ctx.closePath();
    fillStroke(ctx, "#2f7a3e", 1.6, "#1f5a2b");
  } else {
    ctx.beginPath();
    ctx.arc(x, y - 32, 18, 0, Math.PI * 2);
    fillStroke(ctx, "#46a24a", 1.6, "#25602a");
  }
}

function drawHighwayLamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#374151";
  ctx.fillRect(x - 2, y - 34, 4, 34);
  roundRectPath(ctx, x - 5, y - 40, 10, 8, 2);
  fillStroke(ctx, "#fde68a", 1.2, "#374151");
}

