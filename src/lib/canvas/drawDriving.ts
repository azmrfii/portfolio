import { PLAYER_LOOK, TOWN_ZONES, type TownZone, type VehicleType } from "@/data/worldData";
import { fillStroke, groundShadow, roundRectPath, shade } from "./shapes";

export type TrafficKind = "sedan" | "van" | "truck";

export interface HighwayTrafficItem {
  id: number;
  x: number;
  lane: 0 | 1 | 2;
  color: string;
  speed: number;
  kind: TrafficKind;
  /** Already honked at this car (avoid honk spam while following it) */
  honked?: boolean;
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
  /** Lateral position in lane units: lane centers are -1, 0, 1 */
  laneY: number;
  /** Lateral velocity in lanes / second */
  laneVel: number;
  speed: number;
  /** True while slowing down (brake lights) */
  braking: boolean;
  boosting: number;
  honkTimer: number;
  scrollX: number;
  /** Smoothed horizontal screen offset of the vehicle (leans back when accelerating) */
  screenShift: number;
  /** ms since stopping at the destination; null while still driving */
  arrivedFor: number | null;
  traffic: HighwayTrafficItem[];
  boostPads: HighwayBoostPad[];
}

/** World X of the overhead gantry signs */
export const DEPART_GANTRY_X = 150;
export function arriveGantryX(totalDistance: number): number {
  return totalDistance - 120;
}

/** Converts world speed (px/s) to the km/h shown on the dashboard */
export const KMH_PER_PX = 0.24;

const WHEEL_R = 8;

interface VehicleOpts {
  direction?: 1 | -1;
  moving?: boolean;
  boosting?: boolean;
  time?: number;
  scale?: number;
  showDriver?: boolean;
  selected?: boolean;
  /** Wheel rotation in radians; defaults to a time-based spin */
  wheelAngle?: number;
  /** Body pitch in radians (screen space) */
  tilt?: number;
  braking?: boolean;
  /** Body paint for cars */
  color?: string;
}

export function drawVehicleSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vehicle: VehicleType,
  opts: VehicleOpts = {},
): void {
  const dir = opts.direction ?? 1;
  const moving = opts.moving ?? false;
  const time = opts.time ?? 0;
  const scale = opts.scale ?? 1;

  ctx.save();
  ctx.translate(x, y);

  if (opts.selected) {
    ctx.save();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, (vehicle === "car" ? 44 : 32) * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate(opts.tilt ?? 0);
  ctx.scale(dir * scale, scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const wheelAngle = opts.wheelAngle ?? (moving ? time * 0.02 : 0);
  // Gentle suspension sway, slower than the old bounce
  const bounce = moving ? Math.sin(time * 0.011) * 0.6 + Math.sin(time * 0.027) * 0.25 : 0;
  const o = {
    moving,
    boosting: opts.boosting ?? false,
    time,
    showDriver: opts.showDriver ?? true,
    wheelAngle,
    braking: opts.braking ?? false,
    bounce,
  };

  if (vehicle === "car") drawCar(ctx, { ...o, color: opts.color ?? "#e11d48" });
  else drawMoto(ctx, o);

  ctx.restore();
}

interface BodyOpts {
  moving: boolean;
  boosting: boolean;
  time: number;
  showDriver: boolean;
  wheelAngle: number;
  braking: boolean;
  bounce: number;
}

function drawExhaust(ctx: CanvasRenderingContext2D, x: number, y: number, o: BodyOpts): void {
  if (!o.moving) return;
  const n = o.boosting ? 6 : 4;
  for (let i = 0; i < n; i++) {
    const p = (o.time * 0.0035 + i / n) % 1;
    const px = x - p * (o.boosting ? 34 : 22);
    const py = y - p * 5 + Math.sin(o.time * 0.01 + i * 2) * 1.5;
    if (o.boosting) {
      ctx.fillStyle = i % 2 === 0 ? `rgba(56,189,248,${1 - p})` : `rgba(249,115,22,${1 - p})`;
    } else {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.55 * (1 - p)})`;
    }
    ctx.beginPath();
    ctx.arc(px, py, (o.boosting ? 4.5 : 2.6) * (0.6 + p * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHeadlightBeam(ctx: CanvasRenderingContext2D, x: number, y: number, len: number): void {
  const g = ctx.createLinearGradient(x, y, x + len, y);
  g.addColorStop(0, "rgba(254, 240, 138, 0.38)");
  g.addColorStop(1, "rgba(254, 240, 138, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + len, y - 14);
  ctx.lineTo(x + len, y + 12);
  ctx.lineTo(x, y + 2);
  ctx.closePath();
  ctx.fill();
}

export function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  blur: boolean,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fillStroke(ctx, "#111827", 1.4, "#030712");
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r - 1.6, 0, Math.PI * 2);
  ctx.stroke();

  const rim = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0.5, x, y, r * 0.62);
  rim.addColorStop(0, "#f8fafc");
  rim.addColorStop(1, "#94a3b8");
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  fillStroke(ctx, rim, 0.9, "#475569");

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16);
    ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
    ctx.stroke();
  }
  ctx.restore();
  if (blur) {
    ctx.fillStyle = "rgba(203, 213, 225, 0.35)";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.58, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.17, 0, Math.PI * 2);
  fillStroke(ctx, "#334155", 0.8, "#0f172a");
}

/** Sporty hatchback, facing +x, ground at y ≈ 7 */
function drawCar(ctx: CanvasRenderingContext2D, o: BodyOpts & { color: string }): void {
  const body = o.color;
  groundShadow(ctx, 0, 7, 40, 5, 0.32);
  drawExhaust(ctx, -40, -5, o);

  // Dark wheel wells behind the body cut-outs
  for (const wx of [-22, 22]) {
    ctx.beginPath();
    ctx.arc(wx, -1, 10.2, Math.PI, 0);
    ctx.fillStyle = "#0b0f19";
    ctx.fill();
  }

  ctx.save();
  ctx.translate(0, o.bounce);
  if (o.moving) drawHeadlightBeam(ctx, 38, -14, 70);

  // Body silhouette with wheel arches
  ctx.beginPath();
  ctx.moveTo(-37, -5);
  ctx.lineTo(-38.5, -14);
  ctx.quadraticCurveTo(-38.5, -20.5, -32, -21.5);
  ctx.lineTo(-27, -22.5);
  ctx.quadraticCurveTo(-21, -33.5, -14, -34);
  ctx.lineTo(6, -34.5);
  ctx.quadraticCurveTo(12, -34, 15.5, -30);
  ctx.lineTo(21, -23.5);
  ctx.quadraticCurveTo(33.5, -22, 37.5, -17);
  ctx.quadraticCurveTo(40, -12.5, 39.5, -5);
  ctx.lineTo(31.7, -5);
  ctx.arc(22, -1, 10.5, -0.39, -2.75, true);
  ctx.lineTo(-12.3, -5);
  ctx.arc(-22, -1, 10.5, -0.39, -2.75, true);
  ctx.closePath();
  const paint = ctx.createLinearGradient(0, -35, 0, -5);
  paint.addColorStop(0, shade(body, 45));
  paint.addColorStop(0.45, body);
  paint.addColorStop(1, shade(body, -50));
  fillStroke(ctx, paint, 1.6, "#1c1410");

  // Shoulder highlight
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-33, -18.5);
  ctx.quadraticCurveTo(0, -20.5, 33, -18);
  ctx.stroke();

  // Greenhouse
  const windowPath = () => {
    ctx.beginPath();
    ctx.moveTo(-25, -22.5);
    ctx.quadraticCurveTo(-19.5, -31.5, -13.5, -32);
    ctx.lineTo(5.5, -32.4);
    ctx.quadraticCurveTo(10, -32, 13, -28.5);
    ctx.lineTo(18, -22.8);
    ctx.closePath();
  };
  windowPath();
  const glass = ctx.createLinearGradient(0, -32, 0, -22);
  glass.addColorStop(0, "#1e3a5f");
  glass.addColorStop(1, "#7dd3fc");
  ctx.fillStyle = glass;
  ctx.fill();

  ctx.save();
  windowPath();
  ctx.clip();
  if (o.showDriver) {
    // Azzam behind the wheel
    ctx.fillStyle = PLAYER_LOOK.shirt;
    roundRectPath(ctx, -3, -23, 10, 8, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -26.5, 4.6, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_LOOK.skin;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -28, 4.8, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fillStyle = PLAYER_LOOK.hair;
    ctx.fill();
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(5.5, -26, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(10, -27);
    ctx.lineTo(12, -22);
    ctx.stroke();
  }
  // Glass reflections
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.moveTo(-14, -34);
  ctx.lineTo(-8, -34);
  ctx.lineTo(-17, -21);
  ctx.lineTo(-23, -21);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -34);
  ctx.lineTo(11, -34);
  ctx.lineTo(4, -21);
  ctx.lineTo(1, -21);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  windowPath();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // B-pillar, door seams, handles, mirror
  ctx.fillStyle = shade(body, -60);
  ctx.fillRect(-6.5, -32.6, 3, 10.2);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-5, -22);
  ctx.lineTo(-5, -7.5);
  ctx.moveTo(-25, -21.5);
  ctx.quadraticCurveTo(-27, -14, -25, -9);
  ctx.moveTo(17.5, -22);
  ctx.quadraticCurveTo(13.5, -14, 12, -9);
  ctx.stroke();
  ctx.fillStyle = shade(body, -70);
  roundRectPath(ctx, -14, -19.5, 5, 1.8, 0.9);
  ctx.fill();
  roundRectPath(ctx, 4, -19.5, 5, 1.8, 0.9);
  ctx.fill();
  roundRectPath(ctx, 15.5, -25.5, 5, 3.6, 1.5);
  fillStroke(ctx, shade(body, -30), 0.9, "#1c1410");

  // Rocker trim
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(-12, -7.6, 24, 2.6);

  // Lights & bumpers
  roundRectPath(ctx, 33.5, -17.5, 5.5, 4.2, 1.8);
  fillStroke(ctx, "#fef9c3", 0.9, "#713f12");
  roundRectPath(ctx, -39.5, -19.5, 3.6, 5.5, 1.2);
  fillStroke(ctx, o.braking ? "#ff3b5c" : "#be123c", 0.9, "#4c0519");
  if (o.braking) {
    const g = ctx.createRadialGradient(-39, -17, 0, -39, -17, 12);
    g.addColorStop(0, "rgba(255, 59, 92, 0.6)");
    g.addColorStop(1, "rgba(255, 59, 92, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(-39, -17, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  roundRectPath(ctx, 34, -8.5, 7, 3.8, 1.6);
  fillStroke(ctx, "#334155", 0.9, "#0f172a");
  roundRectPath(ctx, -41, -8.5, 7, 3.8, 1.6);
  fillStroke(ctx, "#334155", 0.9, "#0f172a");
  ctx.restore();

  for (const wx of [-22, 22]) drawWheel(ctx, wx, -1, WHEEL_R, o.wheelAngle, o.moving);
}

/** Sport scooter with Azzam riding, facing +x, ground at y ≈ 7 */
function drawMoto(ctx: CanvasRenderingContext2D, o: BodyOpts): void {
  const paint = "#0891b2";
  groundShadow(ctx, 0, 7, 28, 4.5, 0.32);
  drawExhaust(ctx, -28, -7, o);

  drawWheel(ctx, -18, -0.5, 7.5, o.wheelAngle, o.moving);
  drawWheel(ctx, 19, -0.5, 7.5, o.wheelAngle, o.moving);

  ctx.save();
  ctx.translate(0, o.bounce);
  if (o.moving) drawHeadlightBeam(ctx, 24, -18, 60);

  // Swingarm & exhaust
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -0.5);
  ctx.lineTo(-3, -9);
  ctx.stroke();
  roundRectPath(ctx, -27, -12, 15, 4.5, 2.2);
  const chrome = ctx.createLinearGradient(0, -12, 0, -7.5);
  chrome.addColorStop(0, "#f1f5f9");
  chrome.addColorStop(1, "#64748b");
  fillStroke(ctx, chrome, 0.9, "#334155");

  // Fairing
  ctx.beginPath();
  ctx.moveTo(-27, -17);
  ctx.quadraticCurveTo(-24, -24, -14, -23.5);
  ctx.lineTo(-2, -21.5);
  ctx.quadraticCurveTo(6, -28, 14, -28);
  ctx.lineTo(20, -25);
  ctx.quadraticCurveTo(25.5, -20, 23.5, -15);
  ctx.lineTo(14, -11);
  ctx.quadraticCurveTo(4, -6, -6, -9);
  ctx.lineTo(-20, -13);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -28, 0, -8);
  g.addColorStop(0, shade(paint, 55));
  g.addColorStop(0.5, paint);
  g.addColorStop(1, shade(paint, -45));
  fillStroke(ctx, g, 1.5, "#0c1a20");
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-20, -17);
  ctx.quadraticCurveTo(0, -15, 18, -21);
  ctx.stroke();

  // Seat & windscreen
  roundRectPath(ctx, -19, -26.5, 18, 4.8, 2.4);
  fillStroke(ctx, "#1f2937", 1, "#030712");
  ctx.beginPath();
  ctx.moveTo(13.5, -28);
  ctx.quadraticCurveTo(16, -34, 20, -34);
  ctx.lineTo(20.5, -27);
  ctx.closePath();
  fillStroke(ctx, "rgba(186, 230, 253, 0.6)", 1, "#334155");

  // Lights
  ctx.beginPath();
  ctx.ellipse(23, -19, 2.2, 2.8, 0, 0, Math.PI * 2);
  fillStroke(ctx, "#fef9c3", 0.9, "#713f12");
  roundRectPath(ctx, -28.5, -19.5, 3, 3.5, 1);
  fillStroke(ctx, o.braking ? "#ff3b5c" : "#be123c", 0.8, "#4c0519");

  // Front fork
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(16, -22);
  ctx.lineTo(19, -0.5);
  ctx.stroke();

  if (o.showDriver) {
    const look = PLAYER_LOOK;
    // Leg: thigh along the seat, shin down to the footpeg
    ctx.strokeStyle = look.pants;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -27);
    ctx.lineTo(3, -22);
    ctx.lineTo(-1, -12);
    ctx.stroke();
    roundRectPath(ctx, -4, -13, 7, 3.6, 1.6);
    fillStroke(ctx, look.shoes, 0.9);
    // Torso leaning forward
    ctx.save();
    ctx.translate(-6, -34);
    ctx.rotate(0.38);
    roundRectPath(ctx, -5, -9, 10, 17, 4.5);
    fillStroke(ctx, look.shirt, 1.2);
    ctx.restore();
    // Arm to the handlebar
    ctx.strokeStyle = look.shirt;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-2, -39);
    ctx.lineTo(12.5, -29.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(13.5, -29, 2, 0, Math.PI * 2);
    fillStroke(ctx, look.skin, 0.8);
    // Helmet with visor shine
    ctx.beginPath();
    ctx.arc(-1, -47, 7.2, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(-3, -50, 1, -1, -47, 7.5);
    hg.addColorStop(0, "#fef08a");
    hg.addColorStop(1, "#eab308");
    fillStroke(ctx, hg, 1.3, "#713f12");
    roundRectPath(ctx, 0.5, -50.5, 6.8, 5, 2.2);
    fillStroke(ctx, "#0f172a", 0.9, "#1e293b");
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(2, -49.5, 3, 1.2);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-7.5, -48, 6, 1.8);
  }

  // Handlebar
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(15, -27);
  ctx.lineTo(12.5, -30);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// Traffic
// ============================================================================

function drawTraffic(
  ctx: CanvasRenderingContext2D,
  t: HighwayTrafficItem,
  x: number,
  y: number,
  dir: 1 | -1,
  time: number,
): void {
  const wheelAngle = t.x / WHEEL_R;
  if (t.kind === "sedan") {
    drawVehicleSprite(ctx, x, y, "car", {
      direction: dir,
      moving: true,
      time: time + t.id * 333,
      scale: 1.2,
      showDriver: false,
      wheelAngle,
      color: t.color,
    });
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * 1.2, 1.2);
  ctx.lineJoin = "round";
  const bob = Math.sin(time * 0.012 + t.id) * 0.5;
  if (t.kind === "van") drawVan(ctx, t.color, bob);
  else drawTruck(ctx, t.color, bob);
  const wheels = t.kind === "van" ? [-22, 22] : [-30, -18, 26];
  for (const wx of wheels) drawWheel(ctx, wx, -1, WHEEL_R, wheelAngle, true);
  ctx.restore();
}

function drawVan(ctx: CanvasRenderingContext2D, color: string, bob: number): void {
  groundShadow(ctx, 0, 7, 40, 5, 0.3);
  ctx.save();
  ctx.translate(0, bob);
  const g = ctx.createLinearGradient(0, -38, 0, -4);
  g.addColorStop(0, shade(color, 45));
  g.addColorStop(1, shade(color, -40));
  ctx.beginPath();
  ctx.moveTo(-38, -5);
  ctx.lineTo(-38, -33);
  ctx.quadraticCurveTo(-38, -38, -32, -38);
  ctx.lineTo(18, -38);
  ctx.quadraticCurveTo(26, -38, 32, -26);
  ctx.quadraticCurveTo(39, -22, 39, -14);
  ctx.lineTo(39, -5);
  ctx.closePath();
  fillStroke(ctx, g, 1.5, "#1c1410");
  // Windows row
  for (const [wx, ww] of [
    [-33, 14],
    [-16, 14],
    [1, 13],
  ] as const) {
    roundRectPath(ctx, wx, -34, ww, 10, 2);
    fillStroke(ctx, "#7dd3fc", 1, "#0f172a");
  }
  ctx.beginPath();
  ctx.moveTo(18, -34);
  ctx.quadraticCurveTo(24, -34, 28, -25);
  ctx.lineTo(18, -25);
  ctx.closePath();
  fillStroke(ctx, "#7dd3fc", 1, "#0f172a");
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-1, -24);
  ctx.lineTo(-1, -6);
  ctx.moveTo(16, -24);
  ctx.lineTo(16, -6);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(-34, -18, 48, 3);
  roundRectPath(ctx, 35, -17, 4, 4, 1.5);
  fillStroke(ctx, "#fef9c3", 0.8, "#713f12");
  roundRectPath(ctx, -39.5, -20, 3, 6, 1);
  fillStroke(ctx, "#be123c", 0.8, "#4c0519");
  ctx.restore();
}

function drawTruck(ctx: CanvasRenderingContext2D, color: string, bob: number): void {
  groundShadow(ctx, 0, 7, 46, 5, 0.32);
  ctx.save();
  ctx.translate(0, bob);
  // Cargo box
  roundRectPath(ctx, -44, -46, 58, 40, 3);
  fillStroke(ctx, "#f8fafc", 1.5, "#1c1410");
  ctx.fillStyle = color;
  ctx.fillRect(-44, -20, 58, 5);
  ctx.font = "900 8px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  // Keep the livery readable when the sprite is mirrored for leftward trips
  const mirrored = ctx.getTransform().a < 0;
  ctx.save();
  ctx.translate(-15, -33);
  if (mirrored) ctx.scale(-1, 1);
  ctx.fillText("AGL EXPRESS", 0, 0);
  ctx.restore();
  // Cab
  ctx.beginPath();
  ctx.moveTo(16, -5);
  ctx.lineTo(16, -34);
  ctx.lineTo(30, -34);
  ctx.quadraticCurveTo(38, -26, 40, -18);
  ctx.lineTo(40, -5);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -34, 0, -5);
  g.addColorStop(0, shade(color, 45));
  g.addColorStop(1, shade(color, -45));
  fillStroke(ctx, g, 1.5, "#1c1410");
  ctx.beginPath();
  ctx.moveTo(22, -31);
  ctx.lineTo(29.5, -31);
  ctx.quadraticCurveTo(35, -25, 36, -21);
  ctx.lineTo(22, -21);
  ctx.closePath();
  fillStroke(ctx, "#7dd3fc", 1, "#0f172a");
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(14, -12, 4, 8);
  roundRectPath(ctx, 36, -14, 4.5, 4, 1.5);
  fillStroke(ctx, "#fef9c3", 0.8, "#713f12");
  ctx.restore();
}

// ============================================================================
// Scene
// ============================================================================

export interface DrivingLayout {
  roadTop: number;
  roadBottom: number;
  laneH: number;
  roadCenterY: number;
  playerX: number;
  playerY: number;
}

export function drivingLayout(viewW: number, viewH: number, state: DrivingRuntimeState): DrivingLayout {
  const roadH = Math.max(200, Math.min(250, viewH * 0.34));
  const roadCenterY = Math.floor(viewH * 0.58);
  const laneH = roadH / 3;
  const baseX = state.direction === 1 ? viewW * 0.3 : viewW * 0.7;
  return {
    roadTop: roadCenterY - roadH / 2,
    roadBottom: roadCenterY + roadH / 2,
    laneH,
    roadCenterY,
    playerX: baseX + state.screenShift * state.direction,
    playerY: roadCenterY + state.laneY * laneH,
  };
}

function wrap(v: number, span: number): number {
  return ((v % span) + span) % span;
}

/** Calls cb for every prop spaced `step` world units apart that is visible on screen */
function forEachProp(
  viewW: number,
  scroll: number,
  parallax: number,
  step: number,
  dir: 1 | -1,
  cb: (sx: number, idx: number) => void,
): void {
  const offset = scroll * parallax;
  const first = Math.floor((offset - step) / step);
  const last = Math.ceil((offset + viewW + step) / step);
  for (let i = first; i <= last; i++) {
    const rel = i * step - offset;
    cb(dir === 1 ? rel : viewW - rel, i);
  }
}

function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function drawDrivingScene(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  state: DrivingRuntimeState,
  time: number,
): void {
  const L = drivingLayout(viewW, viewH, state);
  const { roadTop, roadBottom, laneH, playerX, playerY } = L;
  const dir = state.direction;
  const scroll = state.scrollX;
  const progress = Math.min(1, Math.max(0, state.distance / state.totalDistance));

  // 1. Sky with a low afternoon sun
  const horizon = roadTop - 46;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#3b82f6");
  sky.addColorStop(0.65, "#93c5fd");
  sky.addColorStop(1, "#fde7b0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, horizon + 2);
  const sunX = dir === 1 ? viewW * 0.82 : viewW * 0.18;
  const sun = ctx.createRadialGradient(sunX, horizon - 90, 4, sunX, horizon - 90, 90);
  sun.addColorStop(0, "rgba(255, 251, 235, 1)");
  sun.addColorStop(0.2, "rgba(254, 240, 138, 0.9)");
  sun.addColorStop(1, "rgba(254, 240, 138, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(sunX - 90, horizon - 180, 180, 180);

  // Clouds (very slow parallax)
  const cloudSpan = viewW + 320;
  for (let i = 0; i < 6; i++) {
    const base = i * (cloudSpan / 6) + hash(i) * 60;
    const cx = wrap(base - scroll * 0.06 * dir - time * 0.006, cloudSpan) - 160;
    const cy = 40 + hash(i + 9) * (horizon * 0.45);
    const s = 0.7 + hash(i + 3) * 0.6;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, 20 * s, 0, Math.PI * 2);
    ctx.arc(cx + 20 * s, cy - 7 * s, 25 * s, 0, Math.PI * 2);
    ctx.arc(cx + 42 * s, cy, 19 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(191, 219, 254, 0.6)";
    ctx.fillRect(cx - 18 * s, cy + 2 * s, 78 * s, 6 * s);
  }

  // 2. Far mountains & near hills drawn from continuous noise (no wrap pops)
  const ridge = (parallax: number, baseY: number, amp: number, freq: number, color: string) => {
    const off = scroll * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, roadTop);
    for (let sx = 0; sx <= viewW + 8; sx += 8) {
      const u = (dir === 1 ? sx : viewW - sx) + off;
      const h =
        Math.sin(u * freq) * amp + Math.sin(u * freq * 2.3 + 1.7) * amp * 0.45 + Math.sin(u * freq * 0.5 + 4) * amp * 0.6;
      ctx.lineTo(sx, baseY - amp * 1.2 - h);
    }
    ctx.lineTo(viewW, roadTop);
    ctx.closePath();
    ctx.fill();
  };
  ridge(0.08, horizon + 6, 26, 0.006, "#a5b4fc");
  ridge(0.08, horizon + 10, 18, 0.009, "#93a5e8");
  ridge(0.22, horizon + 26, 16, 0.012, "#86c97a");
  ridge(0.4, horizon + 40, 10, 0.02, "#6fbf5f");

  // 3. Verges
  ctx.fillStyle = "#74bf55";
  ctx.fillRect(0, horizon + 34, viewW, roadTop - horizon - 34);
  const lowGrass = ctx.createLinearGradient(0, roadBottom, 0, viewH);
  lowGrass.addColorStop(0, "#6cb84e");
  lowGrass.addColorStop(1, "#4f9a3a");
  ctx.fillStyle = lowGrass;
  ctx.fillRect(0, roadBottom, viewW, viewH - roadBottom);

  // Back tree line & lamps
  forEachProp(viewW, scroll, 0.75, 70, dir, (sx, i) => {
    drawRoadsideTree(ctx, sx + hash(i) * 30, roadTop - 26 - hash(i + 5) * 6, hash(i + 2) > 0.5, 0.75);
  });
  forEachProp(viewW, scroll, 1, 260, dir, (sx) => drawHighwayLamp(ctx, sx, roadTop - 8));

  // 4. Road
  ctx.fillStyle = "#8f877a";
  ctx.fillRect(0, roadTop - 10, viewW, roadBottom - roadTop + 20);
  const asphalt = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  asphalt.addColorStop(0, "#4b5563");
  asphalt.addColorStop(0.5, "#525b68");
  asphalt.addColorStop(1, "#424a56");
  ctx.fillStyle = asphalt;
  ctx.fillRect(0, roadTop, viewW, roadBottom - roadTop);
  // Asphalt speckle that scrolls with the road
  forEachProp(viewW, scroll, 1, 23, dir, (sx, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(sx, roadTop + hash(i) * (roadBottom - roadTop), 3, 1.5);
  });
  // Rumble strips on both shoulders
  forEachProp(viewW, scroll, 1, 24, dir, (sx, i) => {
    ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#f8fafc";
    ctx.fillRect(sx, roadTop - 4, 12, 4);
    ctx.fillRect(sx, roadBottom, 12, 4);
  });
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, roadTop + 6, viewW, 3);
  ctx.fillRect(0, roadBottom - 9, viewW, 3);
  for (let lane = 1; lane <= 2; lane++) {
    const ly = roadTop + lane * laneH;
    forEachProp(viewW, scroll, 1, 64, dir, (sx) => {
      ctx.fillStyle = "#facc15";
      ctx.fillRect(dir === 1 ? sx : sx - 34, ly - 2, 34, 4);
    });
  }

  // Guard rail along the far shoulder
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(0, roadTop - 20, viewW, 4);
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(0, roadTop - 16, viewW, 2);
  forEachProp(viewW, scroll, 1, 48, dir, (sx) => {
    ctx.fillStyle = "#64748b";
    ctx.fillRect(sx, roadTop - 20, 3, 12);
  });

  const worldToScreen = (wx: number) => playerX + (wx - state.distance) * dir;

  // 5. Departure / arrival signs on the far verge
  const gantries = [
    { x: DEPART_GANTRY_X, text: `Sampai jumpa, ${TOWN_ZONES[state.fromZone].shortLabel}!`, color: "#0f766e" },
    { x: arriveGantryX(state.totalDistance), text: `Selamat datang di ${TOWN_ZONES[state.toZone].shortLabel}`, color: "#15803d" },
  ];
  for (const g of gantries) {
    const sx = worldToScreen(g.x);
    if (sx < -260 || sx > viewW + 260) continue;
    ctx.font = "800 13px ui-sans-serif, system-ui, sans-serif";
    const tw = ctx.measureText(g.text).width + 30;
    for (const px of [sx - tw / 2 + 14, sx + tw / 2 - 14]) {
      ctx.fillStyle = "#475569";
      ctx.fillRect(px - 2.5, roadTop - 92, 5, 74);
    }
    roundRectPath(ctx, sx - tw / 2, roadTop - 124, tw, 36, 6);
    fillStroke(ctx, g.color, 2.5, "#f8fafc");
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g.text, sx, roadTop - 106);
  }

  // 6. Boost pads
  for (const pad of state.boostPads) {
    if (pad.collected) continue;
    const sx = worldToScreen(pad.x);
    if (sx < -60 || sx > viewW + 60) continue;
    const sy = roadTop + (pad.lane + 0.5) * laneH;
    const pulse = 0.75 + Math.sin(time * 0.01 + pad.id) * 0.25;
    ctx.save();
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 12 * pulse;
    roundRectPath(ctx, sx - 24, sy - 11, 48, 22, 6);
    fillStroke(ctx, `rgba(56, 189, 248, ${0.7 + pulse * 0.2})`, 1.6, "#fde047");
    ctx.restore();
    ctx.fillStyle = "#fef08a";
    for (let k = 0; k < 3; k++) {
      const cx = sx - 12 + k * 10;
      ctx.beginPath();
      ctx.moveTo(cx - 3 * dir, sy - 6);
      ctx.lineTo(cx + 4 * dir, sy);
      ctx.lineTo(cx - 3 * dir, sy + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 7. Vehicles sorted by depth
  const renderables: { y: number; draw: () => void }[] = [];
  for (const t of state.traffic) {
    const sx = worldToScreen(t.x);
    if (sx < -100 || sx > viewW + 100) continue;
    const sy = roadTop + (t.lane + 0.5) * laneH + 6;
    renderables.push({ y: sy, draw: () => drawTraffic(ctx, t, sx, sy, dir, time) });
  }
  const tilt = Math.max(-0.08, Math.min(0.08, state.laneVel * 0.045)) * dir;
  renderables.push({
    y: playerY + 6,
    draw: () => {
      // Dust kicked up behind the wheels
      if (state.speed > 60) {
        for (let i = 0; i < 4; i++) {
          const p = (time * 0.004 + i / 4) % 1;
          ctx.fillStyle = `rgba(214, 211, 209, ${0.35 * (1 - p)})`;
          ctx.beginPath();
          ctx.arc(playerX - dir * (30 + p * 40), playerY + 10 - p * 6, 3 + p * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      drawVehicleSprite(ctx, playerX, playerY + 6, state.vehicle, {
        direction: dir,
        moving: state.speed > 5,
        boosting: state.boosting > 0,
        time,
        scale: 1.4,
        showDriver: true,
        wheelAngle: state.distance / WHEEL_R,
        tilt,
        braking: state.braking,
      });
      if (state.honkTimer > 0) {
        const a = Math.min(1, state.honkTimer / 200);
        ctx.save();
        ctx.globalAlpha = a;
        roundRectPath(ctx, playerX - 40, playerY - 82, 80, 22, 8);
        fillStroke(ctx, "#fef08a", 2, "#713f12");
        ctx.fillStyle = "#713f12";
        ctx.font = "800 11px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TIN! TIN! 📯", playerX, playerY - 71);
        ctx.restore();
      }
    },
  });
  renderables.sort((a, b) => a.y - b.y);
  for (const r of renderables) r.draw();

  // 8. Foreground bushes move faster than the road for depth
  forEachProp(viewW, scroll, 1.35, 120, dir, (sx, i) => {
    drawRoadsideTree(ctx, sx + hash(i + 7) * 50, roadBottom + 52 + hash(i) * 14, hash(i + 1) > 0.6, 1.15);
  });

  // 9. Speed streaks while boosting
  if (state.boosting > 0) {
    const a = Math.min(1, state.boosting / 300);
    ctx.save();
    ctx.globalAlpha = 0.5 * a;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const y = roadTop - 40 + hash(i) * (roadBottom - roadTop + 80);
      const len = 50 + hash(i + 4) * 90;
      const x = wrap(hash(i + 8) * viewW - time * 1.6 * dir, viewW + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * dir, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDashboard(ctx, viewW, state, progress);
}

function drawDashboard(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  state: DrivingRuntimeState,
  progress: number,
): void {
  const fromCfg = TOWN_ZONES[state.fromZone];
  const toCfg = TOWN_ZONES[state.toZone];
  const cardW = Math.min(520, viewW - 32);
  const cardX = (viewW - cardW) / 2;
  const cardY = 16;

  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, 76, 10);
  fillStroke(ctx, "rgba(255, 248, 231, 0.96)", 3, "#5b3a29");

  ctx.fillStyle = "#3b2618";
  ctx.font = "800 13px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const vBadge = state.vehicle === "car" ? "🚗 Naik Mobil" : "🏍️ Naik Motor";
  ctx.fillText(`${vBadge} — Menuju ${toCfg.shortLabel}`, viewW / 2 - 30, cardY + 10);

  // Speedometer pill
  const kmh = Math.round(state.speed * KMH_PER_PX);
  roundRectPath(ctx, cardX + cardW - 86, cardY + 7, 74, 20, 10);
  fillStroke(ctx, state.boosting > 0 ? "#bae6fd" : "#fde68a", 1.5, "#7a4a2a");
  ctx.fillStyle = "#3b2618";
  ctx.font = "800 11px ui-monospace, monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(`${String(kmh).padStart(3, " ")} km/j`, cardX + cardW - 49, cardY + 17.5);

  const barX = cardX + 24;
  const barW = cardW - 48;
  const barY = cardY + 36;
  roundRectPath(ctx, barX, barY, barW, 12, 6);
  fillStroke(ctx, "#e5d5b5", 1.5, "#7a4a2a");
  const fillW = Math.max(12, barW * progress);
  roundRectPath(ctx, barX, barY, fillW, 12, 6);
  ctx.fillStyle = state.boosting > 0 ? "#38bdf8" : "#22c55e";
  ctx.fill();
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(state.vehicle === "car" ? "🚗" : "🏍️", barX + fillW, barY + 6);

  ctx.fillStyle = "#6b4f3a";
  ctx.font = "700 10.5px ui-sans-serif, system-ui, sans-serif";
  const pct = Math.round(progress * 100);
  const hint =
    state.arrivedFor !== null
      ? `Sampai di ${toCfg.shortLabel}! 🎉`
      : state.mode === "manual"
        ? `${fromCfg.shortLabel} ➔ ${toCfg.shortLabel} (${pct}%) · WASD/Panah: Setir & Gas · Space: Klakson`
        : `Perjalanan otomatis ke ${toCfg.shortLabel} (${pct}%) · WASD: Ambil Alih Setir`;
  ctx.fillText(hint, viewW / 2, cardY + 62);
  ctx.restore();
}

function drawRoadsideTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isPine: boolean,
  s: number,
): void {
  groundShadow(ctx, x, y + 2, 18 * s, 5 * s, 0.2);
  roundRectPath(ctx, x - 3.5 * s, y - 20 * s, 7 * s, 22 * s, 2);
  fillStroke(ctx, "#7a4a26", 1.2);
  if (isPine) {
    for (const [w, top, bot] of [
      [18, 30, 10],
      [14, 44, 24],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(x - w * s, y - bot * s);
      ctx.lineTo(x, y - (top + 14) * s);
      ctx.lineTo(x + w * s, y - bot * s);
      ctx.closePath();
      fillStroke(ctx, "#2f7a3e", 1.3, "#1f5a2b");
    }
  } else {
    ctx.beginPath();
    ctx.arc(x - 7 * s, y - 28 * s, 12 * s, 0, Math.PI * 2);
    ctx.arc(x + 7 * s, y - 30 * s, 13 * s, 0, Math.PI * 2);
    ctx.arc(x, y - 40 * s, 13 * s, 0, Math.PI * 2);
    fillStroke(ctx, "#46a24a", 1.3, "#25602a");
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(x - 4 * s, y - 44 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHighwayLamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#475569";
  ctx.fillRect(x - 2, y - 58, 4, 58);
  ctx.fillRect(x - 2, y - 58, 16, 3);
  roundRectPath(ctx, x + 10, y - 58, 10, 5, 2);
  fillStroke(ctx, "#fde68a", 1, "#374151");
}
