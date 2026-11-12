import type { CharacterLook } from "@/data/worldData";
import { OUTLINE, fillStroke, groundShadow, roundRectPath, shade } from "./shapes";
import type { Facing } from "./types";

export interface CharacterPose {
  facing: Facing;
  moving: boolean;
  /** Accumulated ms used for walk cycle */
  walkTime: number;
  waving: boolean;
  waveTime: number;
  time: number;
  /** Desync idle breathing between characters */
  seed?: number;
  /** Seated pose; only supported when facing up or down */
  sitting?: boolean;
}

const LINE = 1.3;

/**
 * Chibi character drawn with vector shapes, feet anchored at (x, y).
 * Local units: ~48 tall before scaling.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  look: CharacterLook,
  pose: CharacterPose,
  scale = 1.1,
): void {
  if (!pose.sitting) groundShadow(ctx, x, y + 1, 11 * scale, 4 * scale, 0.25);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const facing: Facing = pose.waving && pose.facing === "up" ? "down" : pose.facing;

  if (pose.sitting && (facing === "up" || facing === "down")) {
    drawSitting(ctx, look, pose, facing === "down");
  } else if (facing === "left") {
    ctx.scale(-1, 1);
    drawSide(ctx, look, pose);
  } else if (facing === "right") {
    drawSide(ctx, look, pose);
  } else {
    drawFrontBack(ctx, look, pose, facing === "down");
  }

  ctx.restore();
}

function walkSwing(pose: CharacterPose): number {
  return pose.moving ? Math.sin(pose.walkTime * 0.013) : 0;
}

function bodyBob(pose: CharacterPose): number {
  if (pose.moving) return -Math.abs(Math.sin(pose.walkTime * 0.013)) * 1.4;
  return Math.sin(pose.time * 0.004 + (pose.seed ?? 0)) * 0.6;
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  angle: number,
  look: CharacterLook,
  dim = 0,
): void {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  roundRectPath(ctx, -2.3, -1, 4.6, 11, 2.3);
  fillStroke(ctx, dim ? shade(look.skin, dim) : look.skin, LINE);
  roundRectPath(ctx, -2.6, -1.5, 5.2, 5, 2.4);
  fillStroke(ctx, dim ? shade(look.shirt, dim) : look.shirt, LINE);
  ctx.restore();
}

function drawFrontBack(
  ctx: CanvasRenderingContext2D,
  look: CharacterLook,
  pose: CharacterPose,
  front: boolean,
): void {
  const s = walkSwing(pose);
  const bob = bodyBob(pose);

  // Legs (lifted leg gets shorter)
  const liftL = Math.max(0, s) * 2.4;
  const liftR = Math.max(0, -s) * 2.4;
  for (const [lx, lift] of [
    [-5.4, liftL],
    [0.6, liftR],
  ] as const) {
    roundRectPath(ctx, lx, -13, 4.8, 12 - lift, 2);
    fillStroke(ctx, look.pants, LINE);
    ctx.beginPath();
    ctx.ellipse(lx + 2.4, -1.4 - lift, 3.4, 2.1, 0, 0, Math.PI * 2);
    fillStroke(ctx, look.shoes, LINE);
  }

  ctx.save();
  ctx.translate(0, bob);

  // Long hair behind body when seen from the back
  if (!front) drawBackHair(ctx, look, true);

  // Torso
  roundRectPath(ctx, -8, -25, 16, 14, 5);
  fillStroke(ctx, look.shirt, LINE);
  roundRectPath(ctx, -7.6, -14.5, 15.2, 4, 1.5);
  fillStroke(ctx, look.pants, LINE);
  if (front) {
    // collar
    ctx.beginPath();
    ctx.moveTo(-3, -25);
    ctx.lineTo(0, -21.5);
    ctx.lineTo(3, -25);
    ctx.strokeStyle = shade(look.shirt, -40);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Arms
  const leftAngle = s * 0.38;
  drawArm(ctx, -9, -23, leftAngle, look);
  if (pose.waving && front) {
    const a = -2.55 + Math.sin(pose.waveTime * 0.018) * 0.4;
    drawArm(ctx, 9, -23, a, look);
  } else {
    drawArm(ctx, 9, -23, -s * 0.38, look);
  }

  drawHeadFrontBack(ctx, look, pose, front);
  ctx.restore();
}

function drawSitting(
  ctx: CanvasRenderingContext2D,
  look: CharacterLook,
  pose: CharacterPose,
  front: boolean,
): void {
  const still = { ...pose, moving: false };
  ctx.save();
  ctx.translate(0, 6 + bodyBob(still) * 0.5);

  if (!front) drawBackHair(ctx, look, true);

  if (front) {
    // Thighs point toward the viewer, so only shins and shoes show below the torso
    for (const lx of [-6, 1.2]) {
      roundRectPath(ctx, lx, -12, 4.8, 8, 2);
      fillStroke(ctx, look.pants, LINE);
      ctx.beginPath();
      ctx.ellipse(lx + 2.4, -4, 3.4, 2.1, 0, 0, Math.PI * 2);
      fillStroke(ctx, look.shoes, LINE);
    }
  }

  if (!front) {
    // Typing: arms reach forward (up-screen) onto the desk, behind the torso
    drawArm(ctx, -8, -22, -2.75, look);
    drawArm(ctx, 8, -22, 2.75, look);
  }

  roundRectPath(ctx, -8, -25, 16, 14, 5);
  fillStroke(ctx, look.shirt, LINE);
  roundRectPath(ctx, -7.6, -14.5, 15.2, 4, 1.5);
  fillStroke(ctx, look.pants, LINE);

  if (front) {
    // Hands resting on the lap
    drawArm(ctx, -9, -23, -0.35, look);
    if (pose.waving) {
      drawArm(ctx, 9, -23, -2.55 + Math.sin(pose.waveTime * 0.018) * 0.4, look);
    } else {
      drawArm(ctx, 9, -23, 0.35, look);
    }
  }

  drawHeadFrontBack(ctx, look, still, front);
  ctx.restore();
}

function drawBackHair(ctx: CanvasRenderingContext2D, look: CharacterLook, fromBack: boolean): void {
  ctx.fillStyle = look.hair;
  if (look.hairStyle === "long") {
    roundRectPath(ctx, -12.6, -42, 25.2, fromBack ? 26 : 22, 9);
    fillStroke(ctx, look.hair, LINE);
  } else if (look.hairStyle === "bob") {
    roundRectPath(ctx, -13.4, -44, 26.8, 17, 8);
    fillStroke(ctx, look.hair, LINE);
  } else if (look.hairStyle === "ponytail") {
    ctx.beginPath();
    ctx.ellipse(fromBack ? 0 : 11, fromBack ? -26 : -32, 4.2, 7.5, fromBack ? 0 : -0.5, 0, Math.PI * 2);
    fillStroke(ctx, look.hair, LINE);
  }
}

function drawHeadFrontBack(
  ctx: CanvasRenderingContext2D,
  look: CharacterLook,
  pose: CharacterPose,
  front: boolean,
): void {
  const cy = -36;

  if (front) drawBackHair(ctx, look, false);

  // Ears
  for (const ex of [-11.6, 11.6]) {
    ctx.beginPath();
    ctx.arc(ex, cy + 1, 2.4, 0, Math.PI * 2);
    fillStroke(ctx, look.skin, LINE);
  }

  // Head
  ctx.beginPath();
  ctx.arc(0, cy, 12, 0, Math.PI * 2);
  fillStroke(ctx, look.skin, LINE);

  if (!front) {
    // Full hair from behind
    ctx.beginPath();
    ctx.arc(0, cy - 1, 12.8, Math.PI * 0.95, Math.PI * 2.05);
    ctx.lineTo(12.4, cy + 5);
    ctx.quadraticCurveTo(0, cy + 10, -12.4, cy + 5);
    ctx.closePath();
    fillStroke(ctx, look.hair, LINE);
    if (look.hairStyle === "spiky") drawSpikes(ctx, look, cy);
    hairShine(ctx, cy);
    return;
  }

  drawFringe(ctx, look, cy);
  hairShine(ctx, cy);

  // Eyes
  for (const ex of [-4.3, 4.3]) {
    ctx.beginPath();
    ctx.ellipse(ex, cy + 2.5, 1.75, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#2a201c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - 0.5, cy + 1.6, 0.75, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  // Blush
  ctx.fillStyle = "rgba(255, 120, 120, 0.42)";
  for (const bx of [-7.6, 7.6]) {
    ctx.beginPath();
    ctx.ellipse(bx, cy + 6, 2.1, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  if (pose.waving) {
    ctx.moveTo(-2, cy + 7);
    ctx.quadraticCurveTo(0, cy + 10, 2, cy + 7);
    ctx.closePath();
    ctx.fillStyle = "#b8434b";
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.arc(0, cy + 6.6, 1.8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

function drawFringe(ctx: CanvasRenderingContext2D, look: CharacterLook, cy: number): void {
  ctx.beginPath();
  ctx.moveTo(-12.8, cy + 1);
  ctx.arc(0, cy - 1, 12.8, Math.PI * 1.03, Math.PI * 1.97);
  switch (look.hairStyle) {
    case "long":
    case "bob":
      // straight bangs + side locks in front of the ears
      ctx.lineTo(12.9, cy + (look.hairStyle === "long" ? 10 : 7));
      ctx.lineTo(10, cy + (look.hairStyle === "long" ? 10 : 7));
      ctx.lineTo(9.5, cy - 2);
      ctx.lineTo(-9.5, cy - 2);
      ctx.lineTo(-10, cy + (look.hairStyle === "long" ? 10 : 7));
      ctx.lineTo(-12.9, cy + (look.hairStyle === "long" ? 10 : 7));
      break;
    case "ponytail":
      ctx.lineTo(12.6, cy + 3);
      ctx.quadraticCurveTo(4, cy - 6, -6, cy - 1);
      ctx.lineTo(-12.6, cy + 3);
      break;
    default:
      // short / spiky: jagged fringe
      ctx.lineTo(12.8, cy + 3);
      ctx.lineTo(10, cy - 0.5);
      ctx.lineTo(7, cy + 1.5);
      ctx.lineTo(4, cy - 1.5);
      ctx.lineTo(0.5, cy + 0.8);
      ctx.lineTo(-3.5, cy - 1.8);
      ctx.lineTo(-7.5, cy + 1);
      ctx.lineTo(-10.5, cy - 0.5);
      ctx.lineTo(-12.8, cy + 3);
  }
  ctx.closePath();
  fillStroke(ctx, look.hair, LINE);
  if (look.hairStyle === "spiky") drawSpikes(ctx, look, cy);
}

function drawSpikes(ctx: CanvasRenderingContext2D, look: CharacterLook, cy: number): void {
  for (const [bx, tip] of [
    [-7, -17],
    [0, -19],
    [7, -17],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(bx - 4, cy - 10);
    ctx.lineTo(bx, cy + tip + 2);
    ctx.lineTo(bx + 4, cy - 10);
    ctx.closePath();
    fillStroke(ctx, look.hair, LINE);
  }
  // cover inner spike outlines
  ctx.beginPath();
  ctx.arc(0, cy - 1, 11.6, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fillStyle = look.hair;
  ctx.fill();
}

function hairShine(ctx: CanvasRenderingContext2D, cy: number): void {
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(-1, cy - 3, 8, Math.PI * 1.15, Math.PI * 1.45);
  ctx.stroke();
}

function drawSide(ctx: CanvasRenderingContext2D, look: CharacterLook, pose: CharacterPose): void {
  const s = walkSwing(pose);
  const bob = bodyBob(pose);

  const leg = (angle: number, dim: number) => {
    ctx.save();
    ctx.translate(0, -13);
    ctx.rotate(angle);
    roundRectPath(ctx, -2.4, 0, 4.8, 12, 2);
    fillStroke(ctx, dim ? shade(look.pants, dim) : look.pants, LINE);
    ctx.beginPath();
    ctx.ellipse(1.4, 11.6, 3.6, 2.1, 0, 0, Math.PI * 2);
    fillStroke(ctx, dim ? shade(look.shoes, dim) : look.shoes, LINE);
    ctx.restore();
  };
  leg(-s * 0.45, -25);
  leg(s * 0.45, 0);

  ctx.save();
  ctx.translate(0, bob);

  // Back arm
  drawArm(ctx, -1, -23, s * 0.5, look, -25);

  // Torso
  roundRectPath(ctx, -6.2, -25, 12.4, 14, 5);
  fillStroke(ctx, look.shirt, LINE);
  roundRectPath(ctx, -6, -14.5, 12, 4, 1.5);
  fillStroke(ctx, look.pants, LINE);

  // Front arm
  if (pose.waving) {
    drawArm(ctx, 1, -23, -2.4 + Math.sin(pose.waveTime * 0.018) * 0.4, look);
  } else {
    drawArm(ctx, 1, -23, -s * 0.5, look);
  }

  // Head
  const cx = 0.6;
  const cy = -36;

  if (look.hairStyle === "long") {
    roundRectPath(ctx, cx - 13, cy - 6, 15, 22, 7);
    fillStroke(ctx, look.hair, LINE);
  } else if (look.hairStyle === "ponytail") {
    ctx.beginPath();
    ctx.ellipse(cx - 13, cy + 2, 4, 7.5, 0.35, 0, Math.PI * 2);
    fillStroke(ctx, look.hair, LINE);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  fillStroke(ctx, look.skin, LINE);

  // Hair cap covering back & top
  ctx.beginPath();
  ctx.arc(cx, cy - 1, 12.8, Math.PI * 0.82, Math.PI * 1.88);
  ctx.lineTo(cx + 10.5, cy + 1);
  ctx.lineTo(cx + 6.5, cy - 1.5);
  ctx.lineTo(cx + 3, cy + 0.5);
  ctx.lineTo(cx - 2, cy - 1);
  ctx.lineTo(cx - 5, cy + 6);
  ctx.lineTo(cx - 9.5, cy + 7.5);
  ctx.closePath();
  fillStroke(ctx, look.hair, LINE);
  if (look.hairStyle === "bob") {
    roundRectPath(ctx, cx - 13, cy - 2, 9, 12, 4);
    fillStroke(ctx, look.hair, LINE);
  }
  if (look.hairStyle === "spiky") {
    for (const [bx, tip] of [
      [-6, -18],
      [1, -19.5],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(cx + bx - 4, cy - 10);
      ctx.lineTo(cx + bx - 1, cy + tip + 2);
      ctx.lineTo(cx + bx + 4, cy - 10.5);
      ctx.closePath();
      fillStroke(ctx, look.hair, LINE);
    }
  }
  hairShine(ctx, cy);

  // Ear
  ctx.beginPath();
  ctx.arc(cx - 2.5, cy + 2, 2.3, 0, Math.PI * 2);
  fillStroke(ctx, look.skin, LINE);

  // Eye
  ctx.beginPath();
  ctx.ellipse(cx + 6.6, cy + 2.8, 1.6, 2.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#2a201c";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 6.2, cy + 1.9, 0.7, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Blush + mouth
  ctx.fillStyle = "rgba(255,120,120,0.42)";
  ctx.beginPath();
  ctx.ellipse(cx + 8.4, cy + 6.4, 1.8, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(cx + 9.4, cy + 7.6, 1.3, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  ctx.restore();
}
