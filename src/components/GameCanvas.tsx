"use client";

import {
  buildings,
  decor,
  findNearestBuilding,
  getBuildingBounds,
  isBlocked,
  npcs,
  CAMERA_LERP,
  NPC_GREET_DISTANCE,
  PLAYER_SPEED,
  PLAYER_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type BuildingData,
} from "@/data/worldData";
import {
  BRIDGE_RAIL_SORT_Y,
  drawBridgeFrontRail,
  drawBuilding,
  drawDecor,
  drawNpc,
  drawPlayer,
  drawWorldGround,
  updatePlayerAnimation,
  type Facing,
  type InputState,
  type NpcDrawState,
  type PlayerState,
} from "@/lib/canvas";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

export interface GameCanvasHandle {
  setVirtual: (dir: keyof VirtualDirs, pressed: boolean) => void;
  triggerWave: () => void;
  triggerInteract: () => void;
  jumpTo: (x: number, y: number) => void;
}

interface VirtualDirs {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface GameCanvasProps {
  onNearestChange: (building: BuildingData | null) => void;
  onOpenBuilding: (building: BuildingData) => void;
  onPlayerPos: (pos: { x: number; y: number }) => void;
  modalOpen: boolean;
  apiRef: MutableRefObject<GameCanvasHandle | null>;
}

type DrawItem =
  | { kind: "decor" | "building" | "npc"; sortY: number; index: number }
  | { kind: "player" | "bridgeRail"; sortY: number };

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "a",
  "A",
  "d",
  "D",
  "w",
  "W",
  "s",
  "S",
  " ",
  "e",
  "E",
  "Enter",
]);

export default function GameCanvas({
  onNearestChange,
  onOpenBuilding,
  onPlayerPos,
  modalOpen,
  apiRef,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    interact: false,
    wave: false,
  });
  const virtualRef = useRef<VirtualDirs>({ left: false, right: false, up: false, down: false });
  const playerRef = useRef<PlayerState>({
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    vx: 0,
    vy: 0,
    facing: "down",
    anim: "idle",
    animTime: 0,
    waving: false,
    waveTimer: 0,
  });
  const cameraRef = useRef({ x: 0, y: 0 });
  const nearestRef = useRef<BuildingData | null>(null);
  const npcStateRef = useRef<Record<string, NpcDrawState>>(
    Object.fromEntries(npcs.map((n) => [n.id, { waving: false, animTime: 0 }])),
  );
  const interactLatch = useRef(false);
  const waveLatch = useRef(false);
  const modalOpenRef = useRef(modalOpen);

  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);

  const openNearest = useCallback(() => {
    const near = nearestRef.current;
    if (near) onOpenBuilding(near);
  }, [onOpenBuilding]);

  const startWave = useCallback(() => {
    const p = playerRef.current;
    if (p.waving) return;
    p.waving = true;
    p.waveTimer = 1400;
    p.anim = "wave";
    p.animTime = 0;
  }, []);

  useEffect(() => {
    apiRef.current = {
      setVirtual: (dir, pressed) => {
        virtualRef.current[dir] = pressed;
      },
      triggerWave: startWave,
      triggerInteract: openNearest,
      jumpTo: (x, y) => {
        const p = playerRef.current;
        p.x = x;
        p.y = y;
        p.facing = "down";
        const canvas = canvasRef.current;
        const vw = canvas?.clientWidth ?? 800;
        const vh = canvas?.clientHeight ?? 600;
        cameraRef.current.x = cameraTarget(x, vw, WORLD_WIDTH);
        cameraRef.current.y = cameraTarget(y, vh, WORLD_HEIGHT);
        onPlayerPos({ x, y });
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, openNearest, onPlayerPos, startWave]);

  useEffect(() => {
    const setKey = (e: KeyboardEvent, pressed: boolean) => {
      if (!GAME_KEYS.has(e.key)) return;
      e.preventDefault();
      if (modalOpenRef.current && pressed) return;
      const input = inputRef.current;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          input.left = pressed;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          input.right = pressed;
          break;
        case "ArrowUp":
        case "w":
        case "W":
          input.up = pressed;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          input.down = pressed;
          break;
        case " ":
          input.wave = pressed;
          if (!pressed) waveLatch.current = false;
          break;
        default:
          input.interact = pressed;
          if (!pressed) interactLatch.current = false;
      }
    };
    const down = (e: KeyboardEvent) => setKey(e, true);
    const up = (e: KeyboardEvent) => setKey(e, false);
    const blur = () => {
      Object.assign(inputRef.current, { left: false, right: false, up: false, down: false });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onClick = (e: MouseEvent) => {
      if (modalOpenRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left + cameraRef.current.x;
      const my = e.clientY - rect.top + cameraRef.current.y;
      // Front-most building wins when sprites overlap
      const hit = [...buildings]
        .sort((a, b) => b.y - a.y)
        .find((b) => {
          const r = getBuildingBounds(b);
          return mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
        });
      if (hit) onOpenBuilding(hit);
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [onOpenBuilding]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let lastNearestId: string | null = null;
    let lastReport = { x: playerRef.current.x, y: playerRef.current.y };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    cameraRef.current.x = cameraTarget(playerRef.current.x, window.innerWidth, WORLD_WIDTH);
    cameraRef.current.y = cameraTarget(playerRef.current.y, window.innerHeight, WORLD_HEIGHT);

    const tick = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      const viewW = canvas.clientWidth;
      const viewH = canvas.clientHeight;
      const player = playerRef.current;
      const input = inputRef.current;
      const virt = virtualRef.current;

      if (!modalOpenRef.current) {
        let dx = 0;
        let dy = 0;
        if (input.left || virt.left) dx -= 1;
        if (input.right || virt.right) dx += 1;
        if (input.up || virt.up) dy -= 1;
        if (input.down || virt.down) dy += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          dx /= len;
          dy /= len;
          player.facing = facingFromDir(dx, dy);
        }
        player.vx = dx * PLAYER_SPEED;
        player.vy = dy * PLAYER_SPEED;

        // Resolve each axis separately so the player slides along obstacles
        const nextX = player.x + (player.vx * dt) / 1000;
        if (!isBlocked(nextX, player.y)) player.x = nextX;
        const nextY = player.y + (player.vy * dt) / 1000;
        if (!isBlocked(player.x, nextY)) player.y = nextY;

        if (input.wave && !waveLatch.current) {
          waveLatch.current = true;
          startWave();
        }
        if (input.interact && !interactLatch.current) {
          interactLatch.current = true;
          openNearest();
        }
      } else {
        player.vx = 0;
        player.vy = 0;
      }

      updatePlayerAnimation(player, Math.hypot(player.vx, player.vy) > 1, dt);

      const cam = cameraRef.current;
      cam.x += (cameraTarget(player.x, viewW, WORLD_WIDTH) - cam.x) * CAMERA_LERP;
      cam.y += (cameraTarget(player.y, viewH, WORLD_HEIGHT) - cam.y) * CAMERA_LERP;

      const near = findNearestBuilding(player.x, player.y);
      nearestRef.current = near;
      if ((near?.id ?? null) !== lastNearestId) {
        lastNearestId = near?.id ?? null;
        onNearestChange(near);
      }
      if (Math.hypot(player.x - lastReport.x, player.y - lastReport.y) > 2) {
        lastReport = { x: player.x, y: player.y };
        onPlayerPos(lastReport);
      }

      for (const npc of npcs) {
        const state = npcStateRef.current[npc.id];
        state.waving = Math.hypot(player.x - npc.x, player.y - npc.y) <= NPC_GREET_DISTANCE;
        state.animTime = state.waving ? state.animTime + dt : 0;
      }

      const worldCtx = {
        ctx,
        cameraX: cam.x,
        cameraY: cam.y,
        viewW,
        viewH,
        time: now,
      };

      ctx.clearRect(0, 0, viewW, viewH);
      drawWorldGround(worldCtx);

      const items: DrawItem[] = [
        ...decor.map((d, index) => ({ kind: "decor" as const, sortY: d.y, index })),
        ...buildings.map((b, index) => ({ kind: "building" as const, sortY: b.y, index })),
        ...npcs.map((n, index) => ({ kind: "npc" as const, sortY: n.y, index })),
        { kind: "bridgeRail", sortY: BRIDGE_RAIL_SORT_Y },
        { kind: "player", sortY: player.y },
      ];
      items.sort((a, b) => a.sortY - b.sortY);

      for (const item of items) {
        switch (item.kind) {
          case "decor":
            drawDecor(worldCtx, decor[item.index]);
            break;
          case "building":
            drawBuilding(worldCtx, buildings[item.index], near?.id === buildings[item.index].id);
            break;
          case "npc":
            drawNpc(worldCtx, npcs[item.index], npcStateRef.current[npcs[item.index].id]);
            break;
          case "bridgeRail":
            drawBridgeFrontRail(worldCtx);
            break;
          case "player":
            drawPlayer(worldCtx, player);
        }
      }

      if (near && !modalOpenRef.current) {
        const r = getBuildingBounds(near);
        drawHint(ctx, near.x - cam.x, r.top - cam.y - 4);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [onNearestChange, onPlayerPos, openNearest, startWave]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none"
      aria-label="Interactive town portfolio world"
    />
  );
}

/** Follow the player; center the world when the viewport is larger than it */
function cameraTarget(pos: number, view: number, world: number): number {
  if (view >= world) return (world - view) / 2;
  return Math.max(0, Math.min(world - view, pos - view / 2));
}

function facingFromDir(dx: number, dy: number): Facing {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

function drawHint(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const text = "E / klik untuk buka";
  ctx.font = "700 11px ui-sans-serif, system-ui, sans-serif";
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = "rgba(43, 31, 24, 0.85)";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 20, w, 20, 10);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - 10);
}
