import { DRINKS, type DrinkId } from "@/data/aglData";
import { PLAYER_LOOK } from "@/data/worldData";
import { drawCharacter } from "./drawCharacter";
import { drawBarGlass, drawSparkleStar } from "./drawDrink";
import { drawSpeechBubble } from "./drawSpeechBubble";
import { fillStroke } from "./shapes";
import type { PlayerState, WorldRenderContext } from "./types";

export interface PlayerDrinkingState {
  drink: DrinkId;
  /** ms since the player reached for the glass; negative = still waiting */
  elapsed: number;
  /** World position of the glass on the counter (bottom-center) */
  fromX: number;
  fromY: number;
  sipsPlayed: number;
}

export const DRINK_TIMING = { pickup: 550, sip: 950, sips: 3, after: 1500 };
export const DRINK_DURATION =
  DRINK_TIMING.pickup + DRINK_TIMING.sip * DRINK_TIMING.sips + DRINK_TIMING.after;

const SCALE = 1.1;
const FULL = 0.9;

interface DrinkFrame {
  phase: "pickup" | "sip" | "after";
  /** 0..1 within phase */
  p: number;
  sipIndex: number;
  /** 0..1 cup raised toward mouth */
  lift: number;
  fill: number;
}

function drinkFrame(elapsed: number): DrinkFrame {
  const { pickup, sip, sips } = DRINK_TIMING;
  if (elapsed < pickup) {
    return { phase: "pickup", p: elapsed / pickup, sipIndex: 0, lift: 0, fill: FULL };
  }
  const sipT = elapsed - pickup;
  if (sipT < sip * sips) {
    const k = sipT / sip;
    const i = Math.floor(k);
    const sp = k - i;
    const lift = sp < 0.18 ? ease(sp / 0.18) : sp < 0.72 ? 1 : 1 - ease((sp - 0.72) / 0.28);
    const drunk = (i + clamp01((sp - 0.18) / 0.54)) / sips;
    return { phase: "sip", p: sp, sipIndex: i, lift, fill: FULL * (1 - drunk) };
  }
  const after = DRINK_TIMING.after;
  return { phase: "after", p: clamp01((sipT - sip * sips) / after), sipIndex: sips, lift: 0, fill: 0 };
}

/** Index of the sip whose "gulp" moment has passed — used for sound timing */
export function drinkSipsDone(elapsed: number): number {
  const t = elapsed - DRINK_TIMING.pickup - DRINK_TIMING.sip * 0.3;
  if (t < 0) return 0;
  return Math.min(DRINK_TIMING.sips, Math.floor(t / DRINK_TIMING.sip) + 1);
}

export function drawPlayer(
  w: WorldRenderContext,
  player: PlayerState,
  drinking?: PlayerDrinkingState | null,
): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = player.x - cameraX;
  const y = player.y - cameraY;
  if (x < -60 || y < -90 || x > w.viewW + 60 || y > w.viewH + 60) return;
  // Sleeping is drawn by the bed itself
  if (player.pose === "sleep") return;

  const sitting = player.pose === "sit";

  if (!drinking || drinking.elapsed < 0) {
    drawCharacter(ctx, x, y, PLAYER_LOOK, {
      facing: player.facing,
      moving: player.anim === "walk",
      walkTime: player.animTime,
      waving: player.waving,
      waveTime: player.animTime,
      time,
      sitting,
    });
    if (player.waving) {
      drawSpeechBubble(ctx, x, y - (sitting ? 54 : 60), "Halo, selamat datang!", time);
    }
    return;
  }

  const f = drinkFrame(drinking.elapsed);
  const so = sitting ? 6 : 0;
  const L = (v: number) => y + (v + so) * SCALE;

  // Arm angle: low at pickup start, chest-hold, raised while sipping
  let arm = 0.9;
  if (f.phase === "pickup") arm = 0.3 + 0.6 * ease(f.p);
  else if (f.phase === "sip") arm = 0.9 + 0.3 * f.lift;
  else arm = 0.9 - 0.25 * ease(f.p * 4);

  const headBob = f.phase === "sip" && f.lift > 0.95 ? Math.sin(time * 0.025) * 0.6 : 0;
  const expression = f.phase === "after" ? "happy" : f.phase === "sip" && f.lift > 0.9 ? "sip" : undefined;

  drawCharacter(ctx, x, y + headBob, PLAYER_LOOK, {
    facing: "down",
    moving: false,
    walkTime: 0,
    waving: false,
    waveTime: 0,
    time,
    sitting,
    holdArms: arm,
    expression,
  });

  // After-glow aura behind sparkles
  const color = DRINKS[drinking.drink].color;
  if (f.phase === "after") {
    const r = 14 + f.p * 26;
    ctx.save();
    ctx.globalAlpha = (1 - f.p) * 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, L(-18), r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Hand / cup position
  const handY = -23 + Math.cos(arm) * 11;
  let cupX = x;
  let cupBottom = L(handY) + 8;
  if (f.phase === "pickup") {
    const k = ease(Math.min(1, f.p * 1.15));
    const sx = drinking.fromX - cameraX;
    const sy = drinking.fromY - cameraY;
    cupX = sx + (x - sx) * k;
    cupBottom = sy + (cupBottom - sy) * k - Math.sin(k * Math.PI) * 6;
  }
  const mouthY = L(-28.6) + headBob;
  drawBarGlass(ctx, cupX, cupBottom, drinking.drink, {
    fill: f.fill,
    ice: f.phase === "after" ? 0.7 : 1,
    garnished: true,
    time,
    // While sipping the straw reaches the lips instead of poking past the face
    strawTipY:
      f.phase === "sip" && f.lift > 0.5 ? mouthY : f.phase === "after" ? cupBottom - 20 : undefined,
  });

  // Hands wrapped around the glass
  if (f.phase !== "pickup" || f.p > 0.75) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cupX + side * 6.4, cupBottom - 6, 2.6, 3, 0, 0, Math.PI * 2);
      fillStroke(ctx, PLAYER_LOOK.skin, 1.1);
    }
  }

  const bubbleY = y - (sitting ? 58 : 64);
  if (f.phase === "sip") {
    if (f.lift > 0.9) {
      drawSpeechBubble(ctx, x, bubbleY, f.sipIndex === 2 ? "Glek... glek... 🥤" : "Sluuurpp~ 🥤", time);
    }
    // "glek!" pops beside the throat at the end of each sip
    if (f.p > 0.7) {
      const k = (f.p - 0.7) / 0.3;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1e1b4b";
      const gx = x + (f.sipIndex % 2 === 0 ? 18 : -18);
      const gy = L(-30) - k * 12;
      ctx.strokeText("glek!", gx, gy);
      ctx.fillStyle = "#fde047";
      ctx.fillText("glek!", gx, gy);
      ctx.restore();
    }
    // Little bubbles floating out of the glass
    if (drinking.drink !== "popice") {
      for (let i = 0; i < 3; i++) {
        const bp = (time * 0.0018 + i / 3) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - bp)})`;
        ctx.beginPath();
        ctx.arc(cupX + Math.sin(i * 2.4 + time * 0.006) * 7, cupBottom - 18 - bp * 16, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (f.phase === "after") {
    for (let s = 0; s < 6; s++) {
      const p = (time * 0.0016 + s / 6) % 1;
      const ang = s * 1.05 + time * 0.0015;
      const sx = x + Math.cos(ang) * (16 + p * 12);
      const sy = L(-30) - p * 26 + Math.sin(ang) * 6;
      drawSparkleStar(ctx, sx, sy, 4.2 * (1 - p * 0.5), s % 3 === 0 ? "#facc15" : s % 3 === 1 ? "#f0abfc" : "#7dd3fc");
    }
    if (f.p > 0.12) drawSpeechBubble(ctx, x, bubbleY - 4, "Aahhh, segerrr! ✨", time);
  }
}

function ease(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function updatePlayerAnimation(
  player: PlayerState,
  moving: boolean,
  dt: number,
): void {
  player.animTime += dt;
  if (player.waving) {
    player.anim = "wave";
    player.waveTimer -= dt;
    if (player.waveTimer <= 0) {
      player.waving = false;
      player.anim = moving ? "walk" : "idle";
    }
    return;
  }
  player.anim = moving ? "walk" : "idle";
}
