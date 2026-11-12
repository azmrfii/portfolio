import { PLAYER_LOOK } from "@/data/worldData";
import { drawCharacter } from "./drawCharacter";
import { drawSpeechBubble } from "./drawSpeechBubble";
import type { PlayerState, WorldRenderContext } from "./types";

export function drawPlayer(w: WorldRenderContext, player: PlayerState): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = player.x - cameraX;
  const y = player.y - cameraY;
  if (x < -60 || y < -90 || x > w.viewW + 60 || y > w.viewH + 60) return;
  // Sleeping is drawn by the bed itself
  if (player.pose === "sleep") return;

  const sitting = player.pose === "sit";
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
