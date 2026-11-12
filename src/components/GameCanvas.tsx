"use client";

import {
  ABOUT_DIALOG,
  BUCKET_LIST,
  HOUSE_HEIGHT,
  HOUSE_SPAWN,
  HOUSE_WIDTH,
  TOWN_HOUSE_DOOR,
  getFurnitureRect,
  houseCats,
  houseFurniture,
  isHouseBlocked,
  type CatData,
  type HouseDialogueItem,
} from "@/data/houseData";
import {
  CAMERA_LERP,
  NPC_GREET_DISTANCE,
  PLAYER_SPEED,
  PLAYER_START,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  buildings,
  decor,
  findNearestBuilding,
  getBuildingBounds,
  isBlocked,
  npcs,
  type BuildingData,
} from "@/data/worldData";
import { sound } from "@/lib/audio/chiptune";
import {
  BRIDGE_RAIL_SORT_Y,
  drawBridgeFrontRail,
  drawBuilding,
  drawCat,
  drawDecor,
  drawDeskChairBack,
  drawFurnitureItem,
  furnitureTopY,
  drawHouseGround,
  drawNpc,
  drawPlayer,
  drawWorldGround,
  updatePlayerAnimation,
  type CatRuntimeState,
  type Facing,
  type InputState,
  type NpcDrawState,
  type PlayerState,
} from "@/lib/canvas";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { RpgDialogData } from "./RpgDialogBox";

export interface GameCanvasHandle {
  setVirtual: (dir: keyof VirtualDirs, pressed: boolean) => void;
  triggerWave: () => void;
  triggerInteract: () => void;
  jumpTo: (x: number, y: number) => void;
  exitHouse: () => void;
}

interface VirtualDirs {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface GameCanvasProps {
  scene: "town" | "house";
  onSceneChange: (scene: "town" | "house") => void;
  onNearestLabelChange: (label: string | null) => void;
  onOpenBuilding: (building: BuildingData) => void;
  onOpenDialog: (dialog: RpgDialogData) => void;
  onPlayerPos: (pos: { x: number; y: number }) => void;
  overlayOpen: boolean;
  apiRef: MutableRefObject<GameCanvasHandle | null>;
}

type TownDrawItem =
  | { kind: "decor" | "building" | "npc"; sortY: number; index: number }
  | { kind: "player" | "bridgeRail"; sortY: number };

type HouseDrawItem =
  | { kind: "furniture" | "cat"; sortY: number; index: number }
  | { kind: "player"; sortY: number };

type HouseTarget =
  | { kind: "furniture"; item: HouseDialogueItem }
  | { kind: "cat"; cat: CatData; state: CatRuntimeState };

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
  scene,
  onSceneChange,
  onNearestLabelChange,
  onOpenBuilding,
  onOpenDialog,
  onPlayerPos,
  overlayOpen,
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
    pose: "stand",
    anim: "idle",
    animTime: 0,
    waving: false,
    waveTimer: 0,
  });
  /** Furniture the player is currently sitting or sleeping on */
  const seatRef = useRef<HouseDialogueItem | null>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<"town" | "house">(scene);
  const fadeRef = useRef<{ alpha: number; dir: -1 | 0 | 1; onMid?: () => void }>({
    alpha: 0,
    dir: 0,
  });
  const exitCooldownRef = useRef(0);

  const nearestBuildingRef = useRef<BuildingData | null>(null);
  const nearestHouseRef = useRef<HouseTarget | null>(null);

  const npcStateRef = useRef<Record<string, NpcDrawState>>(
    Object.fromEntries(npcs.map((n) => [n.id, { waving: false, animTime: 0 }])),
  );
  const catStateRef = useRef<Record<string, CatRuntimeState>>(
    Object.fromEntries(
      houseCats.map((c, idx) => [
        c.id,
        {
          x: c.homeX,
          y: c.homeY,
          targetX: c.homeX,
          targetY: c.homeY,
          waitTimer: 900 + idx * 450,
          facing: "right" as const,
          moving: false,
          greeted: false,
        },
      ]),
    ),
  );

  const interactLatch = useRef(false);
  const waveLatch = useRef(false);
  const overlayOpenRef = useRef(overlayOpen);

  useEffect(() => {
    overlayOpenRef.current = overlayOpen;
  }, [overlayOpen]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const transitionToScene = useCallback(
    (target: "town" | "house") => {
      if (fadeRef.current.dir !== 0) return;
      sound.playDoor(target === "house");
      fadeRef.current = {
        alpha: 0,
        dir: 1,
        onMid: () => {
          sceneRef.current = target;
          onSceneChange(target);
          sound.setTheme(target);
          const p = playerRef.current;
          p.pose = "stand";
          seatRef.current = null;
          const canvas = canvasRef.current;
          const vw = canvas?.clientWidth ?? 800;
          const vh = canvas?.clientHeight ?? 600;
          if (target === "house") {
            p.x = HOUSE_SPAWN.x;
            p.y = HOUSE_SPAWN.y;
            p.facing = "up";
            exitCooldownRef.current = 700;
            cameraRef.current.x = cameraTarget(p.x, vw, HOUSE_WIDTH);
            cameraRef.current.y = cameraTarget(p.y, vh, HOUSE_HEIGHT);
          } else {
            p.x = TOWN_HOUSE_DOOR.x;
            p.y = TOWN_HOUSE_DOOR.y;
            p.facing = "down";
            cameraRef.current.x = cameraTarget(p.x, vw, WORLD_WIDTH);
            cameraRef.current.y = cameraTarget(p.y, vh, WORLD_HEIGHT);
          }
          onPlayerPos({ x: p.x, y: p.y });
        },
      };
    },
    [onPlayerPos, onSceneChange],
  );

  const standUp = useCallback(() => {
    const p = playerRef.current;
    const item = seatRef.current;
    if (!item || p.pose === "stand") return;
    const spot = item.standSpot ?? { x: p.x, y: p.y + 24 };
    p.x = spot.x;
    p.y = spot.y;
    p.pose = "stand";
    p.facing = "down";
    seatRef.current = null;
  }, []);

  const sitOn = useCallback((item: HouseDialogueItem) => {
    const p = playerRef.current;
    const seats = item.seats ?? [];
    if (seats.length === 0) return;
    const seat = seats.reduce((best, s) =>
      Math.hypot(s.x - p.x, s.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? s : best,
    );
    p.x = seat.x;
    p.y = seat.y;
    p.facing = seat.facing;
    p.pose = "sit";
    p.waving = false;
    seatRef.current = item;

    if (item.kind === "sofa") {
      // Kimmy loves company on the sofa
      const kimmy = catStateRef.current.kimmy;
      const other = seats.find((s) => s !== seat) ?? seat;
      kimmy.targetX = other.x;
      kimmy.targetY = other.y + 30;
      kimmy.waitTimer = 4000;
    }
  }, []);

  const openLaptopMenu = useCallback(
    (item: HouseDialogueItem) => {
      onOpenDialog({
        speaker: item.speaker,
        subtitle: item.room,
        pages: item.pages,
        choices: [
          { id: "about", label: "💻 Lihat tentang Azzam" },
          { id: "cancel", label: "✖ Batal" },
        ],
        onChoice: (id) => {
          if (id === "about") onOpenDialog({ ...ABOUT_DIALOG });
          else standUp();
        },
        onClose: standUp,
      });
    },
    [onOpenDialog, standUp],
  );

  const interactWithFurniture = useCallback(
    (item: HouseDialogueItem) => {
      if (item.isExit) {
        transitionToScene("town");
        return;
      }
      sound.playBlip();
      switch (item.action) {
        case "sit":
          sitOn(item);
          return;
        case "laptop":
          sitOn(item);
          openLaptopMenu(item);
          return;
        case "bed":
          onOpenDialog({
            speaker: item.speaker,
            subtitle: item.room,
            pages: item.pages,
            choices: [
              { id: "sleep", label: "💤 Tidur" },
              { id: "bucket", label: "📝 Lihat Bucket List" },
              { id: "cancel", label: "✖ Batal" },
            ],
            onChoice: (id) => {
              if (id === "sleep") {
                const p = playerRef.current;
                p.pose = "sleep";
                p.waving = false;
                p.x = item.x;
                p.y = item.y - 40;
                seatRef.current = item;
              } else if (id === "bucket") {
                onOpenDialog({
                  speaker: "📝 Bucket List Azzam",
                  subtitle: "Ditempel di papan kepala kasur",
                  pages: [
                    `Hal-hal yang pengen aku lakuin & kunjungi:\n${BUCKET_LIST.map((b) => `☐ ${b}`).join("\n")}`,
                  ],
                  tags: ["Bucket List", "Goals"],
                });
              }
            },
          });
          return;
        default:
          onOpenDialog({
            speaker: item.speaker,
            subtitle: item.room,
            pages: item.pages,
            tags: item.tags,
            image: item.image,
          });
      }
    },
    [onOpenDialog, openLaptopMenu, sitOn, transitionToScene],
  );

  const triggerInteract = useCallback(() => {
    sound.unlockAndStart();
    if (sceneRef.current === "town") {
      const near = nearestBuildingRef.current;
      if (!near) return;
      if (near.id === "home") {
        transitionToScene("house");
      } else {
        sound.playBlip();
        onOpenBuilding(near);
      }
      return;
    }

    // Inside the house
    const p = playerRef.current;
    if (p.pose !== "stand") {
      const seat = seatRef.current;
      if (p.pose === "sit" && seat?.action === "laptop") openLaptopMenu(seat);
      else standUp();
      return;
    }
    const target = nearestHouseRef.current;
    if (!target) return;
    if (target.kind === "furniture") {
      interactWithFurniture(target.item);
    } else {
      sound.playMeow(target.cat.pitch);
      onOpenDialog({
        speaker: `🐱 ${target.cat.name} (Kucing ${target.cat.gender})`,
        subtitle: "Kucing Kesayangan Azzam",
        pages: target.cat.pages,
        tags: ["Cat Lover", target.cat.name],
      });
    }
  }, [interactWithFurniture, onOpenBuilding, onOpenDialog, openLaptopMenu, standUp, transitionToScene]);

  const startWave = useCallback(() => {
    sound.unlockAndStart();
    const p = playerRef.current;
    if (p.waving || p.pose === "sleep") return;
    p.waving = true;
    p.waveTimer = 1400;
    p.anim = "wave";
    p.animTime = 0;
    sound.playBlip();
  }, []);

  useEffect(() => {
    apiRef.current = {
      setVirtual: (dir, pressed) => {
        sound.unlockAndStart();
        virtualRef.current[dir] = pressed;
      },
      triggerWave: startWave,
      triggerInteract,
      jumpTo: (x, y) => {
        sound.unlockAndStart();
        if (sceneRef.current !== "town") return;
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
      exitHouse: () => {
        if (sceneRef.current === "house") {
          transitionToScene("town");
        }
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, onPlayerPos, startWave, transitionToScene, triggerInteract]);

  useEffect(() => {
    const setKey = (e: KeyboardEvent, pressed: boolean) => {
      if (pressed) sound.unlockAndStart();
      if (!GAME_KEYS.has(e.key)) return;
      // Key releases must still register, or a held key stays stuck after a dialog
      if (overlayOpenRef.current && pressed) return;
      e.preventDefault();
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
      sound.unlockAndStart();
      if (overlayOpenRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left + cameraRef.current.x;
      const my = e.clientY - rect.top + cameraRef.current.y;

      if (sceneRef.current === "town") {
        const hit = [...buildings]
          .sort((a, b) => b.y - a.y)
          .find((b) => {
            const r = getBuildingBounds(b);
            return mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
          });
        if (hit) {
          if (hit.id === "home") {
            transitionToScene("house");
          } else {
            sound.playBlip();
            onOpenBuilding(hit);
          }
        }
        return;
      }

      if (playerRef.current.pose !== "stand") return;

      // Click on cats inside the house
      for (const cat of houseCats) {
        const st = catStateRef.current[cat.id];
        if (Math.hypot(mx - st.x, my - (st.y - 10)) <= 26) {
          sound.playMeow(cat.pitch);
          onOpenDialog({
            speaker: `🐱 ${cat.name} (Kucing ${cat.gender})`,
            subtitle: "Kucing Kesayangan Azzam",
            pages: cat.pages,
            tags: ["Cat Lover", cat.name],
          });
          return;
        }
      }

      // Click on furniture inside the house
      const hitF = houseFurniture
        .filter((f) => f.interactive !== false)
        .sort((a, b) => (b.sortY ?? b.y) - (a.sortY ?? a.y))
        .find((f) => {
          const r = getFurnitureRect(f);
          return (
            mx >= r.left - 4 &&
            mx <= r.right + 4 &&
            my >= furnitureTopY(f) &&
            my <= r.bottom + 6
          );
        });
      if (hitF) interactWithFurniture(hitF);
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [interactWithFurniture, onOpenBuilding, onOpenDialog, transitionToScene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let lastLabel: string | null = null;
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
      const inHouse = sceneRef.current === "house";

      if (exitCooldownRef.current > 0) {
        exitCooldownRef.current = Math.max(0, exitCooldownRef.current - dt);
      }

      // Scene fade transition update
      const fade = fadeRef.current;
      if (fade.dir === 1) {
        fade.alpha = Math.min(1, fade.alpha + dt * 0.0045);
        if (fade.alpha >= 1) {
          fade.onMid?.();
          fade.onMid = undefined;
          fade.dir = -1;
        }
      } else if (fade.dir === -1) {
        fade.alpha = Math.max(0, fade.alpha - dt * 0.0045);
        if (fade.alpha <= 0) fade.dir = 0;
      }

      const canMove = !overlayOpenRef.current && fade.dir === 0;
      if (canMove) {
        let dx = 0;
        let dy = 0;
        if (input.left || virt.left) dx -= 1;
        if (input.right || virt.right) dx += 1;
        if (input.up || virt.up) dy -= 1;
        if (input.down || virt.down) dy += 1;

        if (player.pose !== "stand") {
          // Any direction gets the player up; they start walking next frame
          if (dx !== 0 || dy !== 0) standUp();
          dx = 0;
          dy = 0;
        }

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          dx /= len;
          dy /= len;
          player.facing = facingFromDir(dx, dy);
        }
        player.vx = dx * PLAYER_SPEED;
        player.vy = dy * PLAYER_SPEED;

        const blockFn = inHouse ? isHouseBlocked : isBlocked;
        const nextX = player.x + (player.vx * dt) / 1000;
        if (!blockFn(nextX, player.y)) player.x = nextX;
        const nextY = player.y + (player.vy * dt) / 1000;
        if (!blockFn(player.x, nextY)) player.y = nextY;

        if (Math.hypot(player.vx, player.vy) > 5) {
          sound.playStep();
        }

        // Auto-exit when walking onto the front doormat heading down
        if (
          inHouse &&
          exitCooldownRef.current <= 0 &&
          dy > 0 &&
          Math.abs(player.x - 460) < 36 &&
          player.y > 584
        ) {
          transitionToScene("town");
        }

        if (input.wave && !waveLatch.current) {
          waveLatch.current = true;
          startWave();
        }
        if (input.interact && !interactLatch.current) {
          interactLatch.current = true;
          triggerInteract();
        }
      } else {
        player.vx = 0;
        player.vy = 0;
      }

      updatePlayerAnimation(player, Math.hypot(player.vx, player.vy) > 1, dt);

      const mapW = inHouse ? HOUSE_WIDTH : WORLD_WIDTH;
      const mapH = inHouse ? HOUSE_HEIGHT : WORLD_HEIGHT;
      const cam = cameraRef.current;
      cam.x += (cameraTarget(player.x, viewW, mapW) - cam.x) * CAMERA_LERP;
      cam.y += (cameraTarget(player.y, viewH, mapH) - cam.y) * CAMERA_LERP;

      if (Math.hypot(player.x - lastReport.x, player.y - lastReport.y) > 2) {
        lastReport = { x: player.x, y: player.y };
        onPlayerPos(lastReport);
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

      if (!inHouse) {
        // ==================== TOWN RENDER ====================
        const near = findNearestBuilding(player.x, player.y);
        nearestBuildingRef.current = near;
        const label = near ? (near.id === "home" ? "Masuk ke Rumah" : near.name) : null;
        if (label !== lastLabel) {
          lastLabel = label;
          onNearestLabelChange(label);
        }

        for (const npc of npcs) {
          const state = npcStateRef.current[npc.id];
          state.waving = Math.hypot(player.x - npc.x, player.y - npc.y) <= NPC_GREET_DISTANCE;
          state.animTime = state.waving ? state.animTime + dt : 0;
        }

        drawWorldGround(worldCtx);

        const items: TownDrawItem[] = [
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
              drawBuilding(
                worldCtx,
                buildings[item.index],
                near?.id === buildings[item.index].id,
              );
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

        if (near && !overlayOpenRef.current) {
          const r = getBuildingBounds(near);
          const hintText =
            near.id === "home" ? "E / klik untuk masuk rumah 🏠" : "E / klik untuk buka";
          drawHint(ctx, near.x - cam.x, r.top - cam.y - 4, hintText);
        }
      } else {
        // ==================== HOUSE INTERIOR RENDER ====================
        // Update cats roaming & greeting
        for (const cat of houseCats) {
          const st = catStateRef.current[cat.id];
          const distToPlayer = Math.hypot(player.x - st.x, player.y - st.y);
          if (distToPlayer < 72) {
            st.moving = false;
            st.facing = player.x < st.x ? "left" : "right";
            if (!st.greeted) {
              st.greeted = true;
              sound.playMeow(cat.pitch);
            }
          } else {
            if (distToPlayer > 95) st.greeted = false;
            const dx = st.targetX - st.x;
            const dy = st.targetY - st.y;
            const d = Math.hypot(dx, dy);
            if (d > 3) {
              st.moving = true;
              const speed = 38;
              const nx = st.x + (dx / d) * ((speed * dt) / 1000);
              const ny = st.y + (dy / d) * ((speed * dt) / 1000);
              if (!isHouseBlocked(nx, ny)) {
                st.x = nx;
                st.y = ny;
              } else {
                st.targetX = st.x;
                st.targetY = st.y;
              }
              st.facing = dx < 0 ? "left" : "right";
            } else {
              st.moving = false;
              st.waitTimer -= dt;
              if (st.waitTimer <= 0) {
                st.waitTimer = 1400 + Math.random() * 2200;
                const ang = Math.random() * Math.PI * 2;
                const rad = Math.random() * cat.roamRadius;
                const tx = cat.homeX + Math.cos(ang) * rad;
                const ty = cat.homeY + Math.sin(ang) * rad;
                if (!isHouseBlocked(tx, ty)) {
                  st.targetX = tx;
                  st.targetY = ty;
                }
              }
            }
          }
        }

        // Find nearest interactive target inside house (cat or furniture)
        let bestTarget: HouseTarget | null = null;
        if (player.pose === "stand") {
          let bestDist = 40;
          for (const cat of houseCats) {
            const st = catStateRef.current[cat.id];
            const d = Math.hypot(player.x - st.x, player.y - st.y);
            if (d < bestDist) {
              bestDist = d;
              bestTarget = { kind: "cat", cat, state: st };
            }
          }
          for (const f of houseFurniture) {
            if (f.interactive === false) continue;
            // Distance from the player's feet to the furniture footprint
            const r = getFurnitureRect(f);
            const ddx = Math.max(r.left - player.x, 0, player.x - r.right);
            const ddy = Math.max(r.top - player.y, 0, player.y - r.bottom);
            const d = Math.hypot(ddx, ddy) + 6;
            if (d < bestDist) {
              bestDist = d;
              bestTarget = { kind: "furniture", item: f };
            }
          }
        }

        nearestHouseRef.current = bestTarget;
        const label = bestTarget
          ? bestTarget.kind === "cat"
            ? `Sapa ${bestTarget.cat.name}`
            : bestTarget.item.name
          : null;
        if (label !== lastLabel) {
          lastLabel = label;
          onNearestLabelChange(label);
        }

        drawHouseGround(worldCtx);

        const hItems: HouseDrawItem[] = [
          ...houseFurniture.map((f, index) => ({
            kind: "furniture" as const,
            sortY: f.sortY ?? f.y,
            index,
          })),
          ...houseCats.map((c, index) => ({
            kind: "cat" as const,
            sortY: catStateRef.current[c.id].y,
            index,
          })),
          { kind: "player", sortY: player.y },
        ];
        hItems.sort((a, b) => a.sortY - b.sortY);

        for (const it of hItems) {
          switch (it.kind) {
            case "furniture": {
              const f = houseFurniture[it.index];
              const isNear =
                bestTarget?.kind === "furniture" && bestTarget.item.id === f.id;
              const onThis = seatRef.current?.id === f.id;
              drawFurnitureItem(worldCtx, f, isNear, {
                occupied: onThis && player.pose === "sit",
                sleeping: onThis && player.pose === "sleep",
              });
              break;
            }
            case "cat": {
              const c = houseCats[it.index];
              const st = catStateRef.current[c.id];
              const isNear =
                Math.hypot(player.x - st.x, player.y - st.y) <= 78;
              drawCat(worldCtx, c, st, isNear);
              break;
            }
            case "player":
              drawPlayer(worldCtx, player);
              if (player.pose === "sit" && seatRef.current?.kind === "laptop_desk") {
                drawDeskChairBack(worldCtx, seatRef.current);
              }
              break;
          }
        }

        if (player.pose === "sleep") {
          ctx.fillStyle = "rgba(12, 14, 40, 0.42)";
          ctx.fillRect(0, 0, viewW, viewH);
        }

        if (!overlayOpenRef.current) {
          if (player.pose !== "stand") {
            const seat = seatRef.current;
            const text =
              player.pose === "sleep"
                ? "Zzz... tekan E / tombol arah untuk bangun"
                : seat?.action === "laptop"
                  ? "E: buka menu laptop · tombol arah: berdiri"
                  : "E / tombol arah untuk berdiri";
            // While sleeping, keep the hint below the bed so the face on the pillow stays visible
            drawHint(ctx, player.x - cam.x, player.y - cam.y + (player.pose === "sleep" ? 72 : -52), text);
          } else if (bestTarget?.kind === "furniture") {
            const f = bestTarget.item;
            const verb =
              f.action === "sit" ? "duduk" : f.action === "laptop" ? "duduk di laptop" : f.action === "bed" ? "kasur" : f.name;
            drawHint(
              ctx,
              f.x - cam.x,
              furnitureTopY(f) - cam.y - 4,
              f.isExit ? "E / klik untuk keluar rumah" : `E / klik: ${verb}`,
            );
          } else if (bestTarget?.kind === "cat") {
            const st = bestTarget.state;
            drawHint(
              ctx,
              st.x - cam.x,
              st.y - cam.y - 54,
              `E / klik: Elus ${bestTarget.cat.name} 🐾`,
            );
          }
        }
      }

      if (fade.alpha > 0.01) {
        ctx.fillStyle = `rgba(18, 12, 8, ${fade.alpha})`;
        ctx.fillRect(0, 0, viewW, viewH);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [onNearestLabelChange, onPlayerPos, standUp, startWave, transitionToScene, triggerInteract]);

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

function drawHint(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.font = "700 11px ui-sans-serif, system-ui, sans-serif";
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = "rgba(43, 31, 24, 0.88)";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 20, w, 20, 10);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - 10);
}
