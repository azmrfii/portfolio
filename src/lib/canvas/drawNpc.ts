import type { NpcData } from "@/data/worldData";
import { drawCharacter } from "./drawCharacter";
import { drawSpeechBubble } from "./drawSpeechBubble";
import type { WorldRenderContext } from "./types";

export interface NpcDrawState {
  waving: boolean;
  animTime: number;
}

export function drawNpc(w: WorldRenderContext, npc: NpcData, state?: NpcDrawState): void {
  const { ctx, cameraX, cameraY, time } = w;
  const x = npc.x - cameraX;
  const y = npc.y - cameraY;
  if (x < -60 || y < -90 || x > w.viewW + 60 || y > w.viewH + 60) return;

  const waving = state?.waving ?? false;

  drawCharacter(
    ctx,
    x,
    y,
    npc.look,
    {
      facing: "down",
      moving: false,
      walkTime: 0,
      waving,
      waveTime: state?.animTime ?? 0,
      time,
      seed: npc.x * 0.05,
    },
    1.02,
  );

  if (waving) {
    drawSpeechBubble(ctx, x, y - 56, "Halo Azzam!", time);
  }
}
