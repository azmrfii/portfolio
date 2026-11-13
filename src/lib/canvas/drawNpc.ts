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
  const dancing = npc.dancing ?? false;

  // Dancers hop to the beat
  const hop = dancing && !waving ? Math.abs(Math.sin(time * 0.009 + npc.x)) * 3 : 0;

  drawCharacter(
    ctx,
    x,
    y - hop,
    npc.look,
    {
      facing: "down",
      moving: dancing && !waving,
      walkTime: dancing ? time * 0.8 : 0,
      waving,
      waveTime: state?.animTime ?? 0,
      time,
      seed: npc.x * 0.05,
    },
    1.02,
  );

  if (waving) {
    drawSpeechBubble(ctx, x, y - 56, npc.greeting ?? "Halo Azzam!", time);
  }
}
