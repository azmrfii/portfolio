"use client";

import {
  AGL_HEIGHT,
  AGL_SPAWN,
  AGL_WIDTH,
  BAR_COUNTER_TOP_Y,
  BAR_SERVE_RANGE,
  DRINKS,
  TOWN_AGL_DOOR,
  aglFurniture,
  aglNpcs,
  isAglBlocked,
  type AglFurnitureItem,
  type AglNpcData,
  type DrinkId,
} from "@/data/aglData";
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
  TOWN_ZONES,
  ZONE_ORDER,
  findNearestBuildingInZone,
  findNearestGate,
  getBuildingBounds,
  getZoneBuildings,
  getZoneDecor,
  getZoneNpcs,
  isBlockedInZone,
  isNearParking,
  npcs,
  type BuildingData,
  type GateConfig,
  type TownZone,
  type VehicleType,
} from "@/data/worldData";
import { sound } from "@/lib/audio/chiptune";
import { baristaFrame, type BaristaFrame, type BaristaOrder } from "@/lib/canvas/barista";
import {
  DRINK_DURATION,
  aglFurnitureTopY,
  drawAglFurnitureItem,
  drawAglGround,
  drawAglLighting,
  drawAglNpc,
  drawBuilding,
  drawCat,
  drawDecor,
  drawDeskChairBack,
  drawDrivingScene,
  drivingLayout,
  drawFurnitureItem,
  drawHouseGround,
  drawNpc,
  drawPlayer,
  drawWorldGround,
  drinkSipsDone,
  furnitureTopY,
  updatePlayerAnimation,
  type CatRuntimeState,
  type CounterDrink,
  type DrivingRuntimeState,
  type Facing,
  type HighwayBoostPad,
  type HighwayTrafficItem,
  type InputState,
  type NpcDrawState,
  type PlayerDrinkingState,
  type PlayerState,
} from "@/lib/canvas";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { RpgDialogData } from "./RpgDialogBox";

export interface GameCanvasHandle {
  setVirtual: (dir: keyof VirtualDirs, pressed: boolean) => void;
  triggerWave: () => void;
  triggerInteract: () => void;
  travelToZone: (targetZone: TownZone, mode?: "manual" | "auto") => void;
  skipDriving: () => void;
  exitHouse: () => void;
}

interface VirtualDirs {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface GameCanvasProps {
  scene: "town" | "house" | "agl" | "driving";
  onSceneChange: (scene: "town" | "house" | "agl" | "driving") => void;
  zone: TownZone;
  onZoneChange: (zone: TownZone) => void;
  vehicle: VehicleType;
  onVehicleChange: (vehicle: VehicleType) => void;
  onNearestLabelChange: (label: string | null) => void;
  onOpenBuilding: (building: BuildingData) => void;
  onOpenDialog: (dialog: RpgDialogData) => void;
  onPlayerPos: (pos: { x: number; y: number }) => void;
  overlayOpen: boolean;
  apiRef: MutableRefObject<GameCanvasHandle | null>;
}

type TownDrawItem =
  | { kind: "decor" | "building" | "npc"; sortY: number; index: number }
  | { kind: "player"; sortY: number };

type HouseDrawItem =
  | { kind: "furniture" | "cat"; sortY: number; index: number }
  | { kind: "player"; sortY: number };

type HouseTarget =
  | { kind: "furniture"; item: HouseDialogueItem }
  | { kind: "cat"; cat: CatData; state: CatRuntimeState };

type AglDrawItem =
  | { kind: "furniture"; sortY: number; index: number }
  | { kind: "npc"; sortY: number; index: number }
  | { kind: "player"; sortY: number };

type AglTarget =
  | { kind: "furniture"; item: AglFurnitureItem }
  | { kind: "npc"; npc: AglNpcData };

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

function createHighwayTraffic(totalDistance: number): HighwayTrafficItem[] {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#0ea5e9"];
  const kinds: HighwayTrafficItem["kind"][] = ["sedan", "van", "sedan", "truck", "sedan", "van"];
  const lanes: (0 | 1 | 2)[] = [1, 0, 2, 1, 0, 2];
  const count = 6;
  const items: HighwayTrafficItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: i,
      x: 420 + i * ((totalDistance - 700) / count),
      lane: lanes[i],
      color: colors[i % colors.length],
      kind: kinds[i],
      speed: kinds[i] === "truck" ? 120 : 140 + (i % 3) * 18,
    });
  }
  return items;
}

function createBoostPads(totalDistance: number): HighwayBoostPad[] {
  const pads: HighwayBoostPad[] = [];
  for (let i = 0; i < 4; i++) {
    pads.push({
      id: i,
      x: 240 + i * ((totalDistance - 360) / 4),
      lane: (i % 3) as 0 | 1 | 2,
      collected: false,
    });
  }
  return pads;
}

export default function GameCanvas({
  scene,
  onSceneChange,
  zone,
  onZoneChange,
  vehicle,
  onVehicleChange,
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
  const seatRef = useRef<HouseDialogueItem | AglFurnitureItem | null>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<"town" | "house" | "agl" | "driving">(scene);
  const zoneRef = useRef<TownZone>(zone);
  const vehicleRef = useRef<VehicleType>(vehicle);
  const drivingRef = useRef<DrivingRuntimeState | null>(null);
  const lastInteriorRef = useRef<"house" | "agl">("house");
  const fadeRef = useRef<{
    alpha: number;
    dir: -1 | 0 | 1;
    /** "iris" closes a circle around the player/vehicle instead of a flat fade */
    style?: "fade" | "iris";
    onMid?: () => void;
  }>({
    alpha: 0,
    dir: 0,
  });
  const exitCooldownRef = useRef(0);
  const gateCooldownRef = useRef(0);

  const nearestBuildingRef = useRef<BuildingData | null>(null);
  const nearestGateRef = useRef<GateConfig | null>(null);
  const nearParkingRef = useRef<boolean>(false);
  const nearestHouseRef = useRef<HouseTarget | null>(null);
  const nearestAglRef = useRef<AglTarget | null>(null);

  const dymasCraftingRef = useRef<(BaristaOrder & { lastSfx: number; lastStep: number }) | null>(
    null,
  );
  const playerDrinkingRef = useRef<PlayerDrinkingState | null>(null);
  /** Glass sitting on the bar counter (served, or empty after drinking) */
  const counterDrinkRef = useRef<CounterDrink | null>(null);

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
  const onOpenDialogRef = useRef(onOpenDialog);
  const onSceneChangeRef = useRef(onSceneChange);
  const onZoneChangeRef = useRef(onZoneChange);
  const onVehicleChangeRef = useRef(onVehicleChange);
  const onPlayerPosRef = useRef(onPlayerPos);
  const onNearestLabelChangeRef = useRef(onNearestLabelChange);
  const onOpenBuildingRef = useRef(onOpenBuilding);

  useEffect(() => {
    overlayOpenRef.current = overlayOpen;
  }, [overlayOpen]);

  useEffect(() => {
    onOpenDialogRef.current = onOpenDialog;
  }, [onOpenDialog]);

  useEffect(() => {
    onSceneChangeRef.current = onSceneChange;
  }, [onSceneChange]);

  useEffect(() => {
    onZoneChangeRef.current = onZoneChange;
  }, [onZoneChange]);

  useEffect(() => {
    onVehicleChangeRef.current = onVehicleChange;
  }, [onVehicleChange]);

  useEffect(() => {
    onPlayerPosRef.current = onPlayerPos;
  }, [onPlayerPos]);

  useEffect(() => {
    onNearestLabelChangeRef.current = onNearestLabelChange;
  }, [onNearestLabelChange]);

  useEffect(() => {
    onOpenBuildingRef.current = onOpenBuilding;
  }, [onOpenBuilding]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    zoneRef.current = zone;
  }, [zone]);

  useEffect(() => {
    vehicleRef.current = vehicle;
  }, [vehicle]);

  const startDriving = useCallback(
    (targetZone: TownZone, mode: "manual" | "auto" = "manual", chosenVehicle?: VehicleType) => {
      if (fadeRef.current.dir !== 0) return;
      if (sceneRef.current === "town" && targetZone === zoneRef.current) return;

      const v = chosenVehicle ?? vehicleRef.current;
      if (chosenVehicle && chosenVehicle !== vehicleRef.current) {
        vehicleRef.current = chosenVehicle;
        onVehicleChangeRef.current(chosenVehicle);
      }

      const fromZone = zoneRef.current;
      const fromIdx = ZONE_ORDER.indexOf(fromZone);
      const toIdx = ZONE_ORDER.indexOf(targetZone);
      const direction: 1 | -1 = toIdx >= fromIdx ? 1 : -1;
      const totalDistance = mode === "auto" ? 1250 : 2100;

      sound.unlockAndStart();
      sound.playHorn(v === "moto");

      fadeRef.current = {
        alpha: 0,
        dir: 1,
        style: "iris",
        onMid: () => {
          drivingRef.current = {
            fromZone,
            toZone: targetZone,
            vehicle: v,
            mode,
            direction,
            distance: 0,
            totalDistance,
            laneY: 0,
            laneVel: 0,
            // Starts from rest and pulls away smoothly
            speed: 0,
            braking: false,
            boosting: 0,
            honkTimer: 0,
            scrollX: 0,
            screenShift: 0,
            arrivedFor: null,
            traffic: createHighwayTraffic(totalDistance),
            boostPads: createBoostPads(totalDistance),
          };
          sceneRef.current = "driving";
          onSceneChangeRef.current("driving");
          sound.setTheme("driving");
          onNearestLabelChangeRef.current(null);
        },
      };
    },
    [],
  );

  const finishDriving = useCallback(() => {
    const d = drivingRef.current;
    if (!d || fadeRef.current.dir !== 0) return;
    const destZone = d.toZone;
    const dir = d.direction;

    fadeRef.current = {
      alpha: 0,
      dir: 1,
      style: "iris",
      onMid: () => {
        drivingRef.current = null;
        zoneRef.current = destZone;
        onZoneChangeRef.current(destZone);
        sceneRef.current = "town";
        onSceneChangeRef.current("town");
        sound.setTheme("town");

        const cfg = TOWN_ZONES[destZone];
        const spawn =
          dir === 1
            ? (cfg.spawnFromLeft ?? cfg.defaultSpawn)
            : (cfg.spawnFromRight ?? cfg.defaultSpawn);

        const p = playerRef.current;
        p.pose = "stand";
        p.x = spawn.x;
        p.y = spawn.y;
        p.facing = dir === 1 ? "right" : "left";
        gateCooldownRef.current = 1200;

        const canvas = canvasRef.current;
        const vw = canvas?.clientWidth ?? 800;
        const vh = canvas?.clientHeight ?? 600;
        cameraRef.current.x = cameraTarget(p.x, vw, cfg.width);
        cameraRef.current.y = cameraTarget(p.y, vh, cfg.height);
        onPlayerPosRef.current({ x: p.x, y: p.y });
      },
    };
  }, []);

  const transitionToScene = useCallback((target: "town" | "house" | "agl") => {
    if (fadeRef.current.dir !== 0) return;
    sound.playDoor(target !== "town");
    fadeRef.current = {
      alpha: 0,
      dir: 1,
      onMid: () => {
        sceneRef.current = target;
        onSceneChangeRef.current(target);
        sound.setTheme(target);
        const p = playerRef.current;
        p.pose = "stand";
        seatRef.current = null;
        dymasCraftingRef.current = null;
        playerDrinkingRef.current = null;
        counterDrinkRef.current = null;
        const canvas = canvasRef.current;
        const vw = canvas?.clientWidth ?? 800;
        const vh = canvas?.clientHeight ?? 600;
        if (target === "house") {
          lastInteriorRef.current = "house";
          p.x = HOUSE_SPAWN.x;
          p.y = HOUSE_SPAWN.y;
          p.facing = "up";
          exitCooldownRef.current = 700;
          cameraRef.current.x = cameraTarget(p.x, vw, HOUSE_WIDTH);
          cameraRef.current.y = cameraTarget(p.y, vh, HOUSE_HEIGHT);
        } else if (target === "agl") {
          lastInteriorRef.current = "agl";
          p.x = AGL_SPAWN.x;
          p.y = AGL_SPAWN.y;
          p.facing = "up";
          exitCooldownRef.current = 700;
          cameraRef.current.x = cameraTarget(p.x, vw, AGL_WIDTH);
          cameraRef.current.y = cameraTarget(p.y, vh, AGL_HEIGHT);
        } else {
          zoneRef.current = "home_zone";
          onZoneChangeRef.current("home_zone");
          const cfg = TOWN_ZONES.home_zone;
          const door = lastInteriorRef.current === "agl" ? TOWN_AGL_DOOR : TOWN_HOUSE_DOOR;
          p.x = door.x;
          p.y = door.y;
          p.facing = "down";
          cameraRef.current.x = cameraTarget(p.x, vw, cfg.width);
          cameraRef.current.y = cameraTarget(p.y, vh, cfg.height);
        }
        onPlayerPosRef.current({ x: p.x, y: p.y });
      },
    };
  }, []);

  const openParkingDialog = useCallback(() => {
    sound.playBlip();
    const curV = vehicleRef.current;
    const curZ = zoneRef.current;
    const otherZones = ZONE_ORDER.filter((z) => z !== curZ);

    onOpenDialogRef.current({
      speaker: "🅿️ Garasi & Parkiran Kendaraan",
      subtitle: `Kendaraan aktif: ${curV === "car" ? "🚗 Mobil Sedan Merah" : "🏍️ Motor Sport Cyan"}`,
      pages: [
        "Pilih kendaraan favoritmu (Mobil atau Motor), lalu langsung tancap gas menuju Map Pendidikan atau Map Pekerjaan!",
      ],
      tags: ["Garasi", "Mobil Sedan", "Motor Sport", "3 Map"],
      choices: [
        ...otherZones.map((z) => ({
          id: `drive_${z}`,
          label: `${curV === "car" ? "🚗" : "🏍️"} Setir Sendiri ke ${TOWN_ZONES[z].shortLabel}`,
        })),
        {
          id: "switch_vehicle",
          label:
            curV === "car"
              ? "🏍️ Ganti ke Motor Sport"
              : "🚗 Ganti ke Mobil Sedan",
        },
        { id: "cancel", label: "✖ Tutup" },
      ],
      onChoice: (id) => {
        if (id === "switch_vehicle") {
          const nextV: VehicleType = curV === "car" ? "moto" : "car";
          vehicleRef.current = nextV;
          onVehicleChangeRef.current(nextV);
          sound.playHorn(nextV === "moto");
          onOpenDialogRef.current({
            speaker: nextV === "car" ? "🚗 Mobil Sedan Siap!" : "🏍️ Motor Sport Siap!",
            subtitle: "Garasi & Parkiran",
            pages: [
              nextV === "car"
                ? "Kunci mobil sudah di tangan! Jalan ke gerbang jalan raya atau pilih map untuk menyetir mobil."
                : "Helm full-face sudah dipakai! Jalan ke gerbang jalan raya atau pilih map untuk riding naik motor.",
            ],
            choices: [
              ...otherZones.map((z) => ({
                id: `go_${z}`,
                label: `${nextV === "car" ? "🚗" : "🏍️"} Gas Berangkat ke ${TOWN_ZONES[z].shortLabel}`,
              })),
              { id: "ok", label: "👍 Siap" },
            ],
            onChoice: (subId) => {
              if (subId.startsWith("go_")) {
                const target = subId.replace("go_", "") as TownZone;
                startDriving(target, "manual", nextV);
              }
            },
          });
        } else if (id.startsWith("drive_")) {
          const target = id.replace("drive_", "") as TownZone;
          startDriving(target, "manual", curV);
        }
      },
    });
  }, [startDriving]);

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

  const sitOn = useCallback((item: HouseDialogueItem | AglFurnitureItem) => {
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

    if ("kind" in item && item.kind === "sofa") {
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
      onOpenDialogRef.current({
        speaker: item.speaker,
        subtitle: item.room,
        pages: item.pages,
        choices: [
          { id: "about", label: "💻 Lihat tentang Azzam" },
          { id: "cancel", label: "✖ Batal" },
        ],
        onChoice: (id) => {
          if (id === "about") onOpenDialogRef.current({ ...ABOUT_DIALOG });
          else standUp();
        },
        onClose: standUp,
      });
    },
    [standUp],
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
          onOpenDialogRef.current({
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
                onOpenDialogRef.current({
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
          onOpenDialogRef.current({
            speaker: item.speaker,
            subtitle: item.room,
            pages: item.pages,
            tags: item.tags,
            links: item.links,
            image: item.image,
          });
      }
    },
    [openLaptopMenu, sitOn, transitionToScene],
  );

  const interactWithAglNpc = useCallback((npc: AglNpcData) => {
    sound.playBlip();
    if (npc.id === "dymas") {
      if (dymasCraftingRef.current || playerDrinkingRef.current) return;
      onOpenDialogRef.current({
        speaker: `${npc.name} (${npc.role})`,
        subtitle: "AGL — Bar & Lounge",
        pages: npc.pages,
        tags: npc.tags,
        choices: npc.choices,
        onChoice: (id) => {
          if (id === "drink_sprite" || id === "drink_cola" || id === "drink_popice") {
            const drinkId: DrinkId =
              id === "drink_sprite" ? "sprite" : id === "drink_cola" ? "cola" : "popice";
            const p = playerRef.current;
            p.facing = "up";
            p.waving = false;
            counterDrinkRef.current = null;
            dymasCraftingRef.current = {
              drink: drinkId,
              elapsed: 0,
              serveX: Math.max(BAR_SERVE_RANGE.min, Math.min(BAR_SERVE_RANGE.max, p.x)),
              lastSfx: 0,
              lastStep: -1,
            };
            sound.playBlip();
          } else if (id === "chat") {
            onOpenDialogRef.current({
              speaker: "💬 Dymas",
              subtitle: "Ngobrol Santai",
              pages: [
                "Dymas: 'Keren banget Zam karya-karya lu sekarang. Kapan-kapan luangkan waktu nongkrong lamaan ya bro!'",
                "Dymas: 'Kalau butuh mood booster pas nongkrong di AGL, tinggal pesen Sprite, Coca Cola, atau Pop Ice!'",
              ],
              tags: ["Barista Dymas", "Teman Rumah"],
            });
          }
        },
      });
    } else if (npc.id === "valdy") {
      onOpenDialogRef.current({
        speaker: `${npc.name} (${npc.role})`,
        subtitle: "AGL — Resident DJ",
        pages: npc.pages,
        tags: npc.tags,
        choices: npc.choices,
        onChoice: (id) => {
          if (id === "drop_beat") {
            sound.playDoor(true);
            onOpenDialogRef.current({
              speaker: "🎧 Valdy (DJ AGL)",
              subtitle: "Drop The Beat",
              pages: ["Valdy: '1, 2, 3... DROP! *BASS BOOSTED* Let's goooo! 🔥'"],
              tags: ["Drop The Beat", "BASS"],
            });
          } else if (id === "chill_music") {
            onOpenDialogRef.current({
              speaker: "🎧 Valdy (DJ AGL)",
              subtitle: "Lo-Fi Lounge",
              pages: [
                "Valdy: 'Siap Zam, kita set tempo santai dulu biar enak buat ngobrol bareng Kaila, Syifa, sama Aliyah.'",
              ],
              tags: ["Chill Vibes"],
            });
          } else if (id === "compliment") {
            onOpenDialogRef.current({
              speaker: "✨ Valdy",
              subtitle: "DJ AGL",
              pages: [
                "Valdy: 'Hahaha thank you Zam! Lu emang paling ngerti selera musik yang enak!'",
              ],
            });
          }
        },
      });
    } else {
      onOpenDialogRef.current({
        speaker: `${npc.name} (${npc.role})`,
        subtitle: "AGL — Teman Rumah",
        pages: npc.pages,
        tags: npc.tags,
      });
    }
  }, []);

  const interactWithAglFurniture = useCallback(
    (item: AglFurnitureItem) => {
      if (item.isExit) {
        transitionToScene("town");
        return;
      }
      sound.playBlip();
      if (item.action === "sit") {
        sitOn(item);
        return;
      }
      if (item.id === "bar_counter") {
        const dymas = aglNpcs.find((n) => n.id === "dymas");
        if (dymas) {
          interactWithAglNpc(dymas);
          return;
        }
      }
      onOpenDialogRef.current({
        speaker: item.speaker,
        subtitle: "AGL Diskotik & Bar",
        pages: item.pages,
        tags: item.tags,
        choices: item.choices,
      });
    },
    [interactWithAglNpc, sitOn, transitionToScene],
  );

  const triggerInteract = useCallback(() => {
    sound.unlockAndStart();
    if (sceneRef.current === "driving") {
      const d = drivingRef.current;
      if (d) {
        d.honkTimer = 600;
        sound.playHorn(d.vehicle === "moto");
      }
      return;
    }

    if (sceneRef.current === "town") {
      if (nearestGateRef.current) {
        startDriving(nearestGateRef.current.toZone, "manual");
        return;
      }
      if (nearParkingRef.current) {
        openParkingDialog();
        return;
      }
      const near = nearestBuildingRef.current;
      if (!near) return;
      if (near.id === "home") {
        transitionToScene("house");
      } else if (near.id === "agl") {
        transitionToScene("agl");
      } else {
        sound.playBlip();
        onOpenBuildingRef.current(near);
      }
      return;
    }

    if (sceneRef.current === "agl") {
      const p = playerRef.current;
      const target = nearestAglRef.current;
      const ordersFromSeat =
        target && (target.kind === "npc" || target.item.id === "bar_counter");
      if (p.pose !== "stand" && !ordersFromSeat) {
        standUp();
        return;
      }
      if (target?.kind === "furniture") interactWithAglFurniture(target.item);
      else if (target) interactWithAglNpc(target.npc);
      return;
    }

    // Inside the house
    const p = playerRef.current;
    if (p.pose !== "stand") {
      const seat = seatRef.current;
      if (p.pose === "sit" && seat && "action" in seat && seat.action === "laptop") {
        openLaptopMenu(seat as HouseDialogueItem);
      } else {
        standUp();
      }
      return;
    }
    const target = nearestHouseRef.current;
    if (!target) return;
    if (target.kind === "furniture") {
      interactWithFurniture(target.item);
    } else {
      sound.playMeow(target.cat.pitch);
      onOpenDialogRef.current({
        speaker: `🐱 ${target.cat.name} (Kucing ${target.cat.gender})`,
        subtitle: "Kucing Kesayangan Azzam",
        pages: target.cat.pages,
        tags: ["Cat Lover", target.cat.name],
      });
    }
  }, [
    interactWithAglFurniture,
    interactWithAglNpc,
    interactWithFurniture,
    openLaptopMenu,
    openParkingDialog,
    standUp,
    startDriving,
    transitionToScene,
  ]);

  const startWave = useCallback(() => {
    sound.unlockAndStart();
    if (sceneRef.current === "driving") {
      const d = drivingRef.current;
      if (d) {
        d.honkTimer = 650;
        sound.playHorn(d.vehicle === "moto");
      }
      return;
    }
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
      travelToZone: (targetZone, mode = "auto") => {
        sound.unlockAndStart();
        startDriving(targetZone, mode);
      },
      skipDriving: () => {
        sound.unlockAndStart();
        finishDriving();
      },
      exitHouse: () => {
        if (sceneRef.current === "house" || sceneRef.current === "agl") {
          transitionToScene("town");
        }
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, finishDriving, startDriving, startWave, transitionToScene, triggerInteract]);

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
      if (sceneRef.current === "driving") {
        const d = drivingRef.current;
        if (d) {
          d.honkTimer = 600;
          sound.playHorn(d.vehicle === "moto");
        }
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left + cameraRef.current.x;
      const my = e.clientY - rect.top + cameraRef.current.y;

      if (sceneRef.current === "town") {
        const curZone = zoneRef.current;
        const cfg = TOWN_ZONES[curZone];

        // Check click on Highway Gates
        for (const gate of [cfg.leftGate, cfg.rightGate]) {
          if (gate && Math.hypot(mx - gate.x, my - (gate.y + 18)) <= 68) {
            startDriving(gate.toZone, "manual");
            return;
          }
        }

        // Check click on Parking Lot (Car or Moto)
        const pSpot = cfg.parkingSpot;
        if (Math.abs(mx - pSpot.x) <= 82 && Math.abs(my - pSpot.y) <= 44) {
          // Clicking left half selects car, right half selects moto, and opens garage menu
          const clickedV: VehicleType = mx < pSpot.x ? "car" : "moto";
          if (clickedV !== vehicleRef.current) {
            vehicleRef.current = clickedV;
            onVehicleChangeRef.current(clickedV);
            sound.playHorn(clickedV === "moto");
          }
          openParkingDialog();
          return;
        }

        const zoneBlds = getZoneBuildings(curZone);
        const hit = [...zoneBlds]
          .sort((a, b) => b.y - a.y)
          .find((b) => {
            const r = getBuildingBounds(b);
            return mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
          });
        if (hit) {
          if (hit.id === "home") {
            transitionToScene("house");
          } else if (hit.id === "agl") {
            transitionToScene("agl");
          } else {
            sound.playBlip();
            onOpenBuildingRef.current(hit);
          }
        }
        return;
      }

      if (sceneRef.current === "agl") {
        // Click on AGL NPCs
        for (const npc of aglNpcs) {
          if (Math.abs(mx - npc.x) <= 16 && my >= npc.y - 52 && my <= npc.y + 4) {
            interactWithAglNpc(npc);
            return;
          }
        }
        // Click on AGL Furniture
        const hitF = aglFurniture
          .filter((f) => f.interactive !== false)
          .sort((a, b) => (b.sortY ?? b.y) - (a.sortY ?? a.y))
          .find((f) => {
            const left = f.x - f.width / 2;
            const right = f.x + f.width / 2;
            return mx >= left - 4 && mx <= right + 4 && my >= aglFurnitureTopY(f) && my <= f.y + 6;
          });
        if (hitF) {
          interactWithAglFurniture(hitF);
          return;
        }
        if (playerRef.current.pose !== "stand") {
          standUp();
        }
        return;
      }

      if (playerRef.current.pose !== "stand") return;

      // Click on cats inside the house
      for (const cat of houseCats) {
        const st = catStateRef.current[cat.id];
        if (Math.hypot(mx - st.x, my - (st.y - 10)) <= 26) {
          sound.playMeow(cat.pitch);
          onOpenDialogRef.current({
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
  }, [
    interactWithAglFurniture,
    interactWithAglNpc,
    interactWithFurniture,
    openParkingDialog,
    standUp,
    startDriving,
    transitionToScene,
  ]);

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

    const startZoneCfg = TOWN_ZONES[zoneRef.current];
    cameraRef.current.x = cameraTarget(
      playerRef.current.x,
      window.innerWidth,
      startZoneCfg.width,
    );
    cameraRef.current.y = cameraTarget(
      playerRef.current.y,
      window.innerHeight,
      startZoneCfg.height,
    );

    const tick = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      const viewW = canvas.clientWidth;
      const viewH = canvas.clientHeight;
      const player = playerRef.current;
      const input = inputRef.current;
      const virt = virtualRef.current;
      const inHouse = sceneRef.current === "house";
      const inAgl = sceneRef.current === "agl";
      const inDriving = sceneRef.current === "driving";

      if (exitCooldownRef.current > 0) {
        exitCooldownRef.current = Math.max(0, exitCooldownRef.current - dt);
      }
      if (gateCooldownRef.current > 0) {
        gateCooldownRef.current = Math.max(0, gateCooldownRef.current - dt);
      }

      // Scene fade transition update
      const fade = fadeRef.current;
      const fadeRate = fade.style === "iris" ? 0.0024 : 0.0045;
      if (fade.dir === 1) {
        fade.alpha = Math.min(1, fade.alpha + dt * fadeRate);
        if (fade.alpha >= 1) {
          fade.onMid?.();
          fade.onMid = undefined;
          fade.dir = -1;
        }
      } else if (fade.dir === -1) {
        fade.alpha = Math.max(0, fade.alpha - dt * fadeRate);
        if (fade.alpha <= 0) {
          fade.dir = 0;
          fade.style = undefined;
        }
      }

      // ==================== DRIVING SCENE UPDATE & RENDER ====================
      if (inDriving && drivingRef.current) {
        const d = drivingRef.current;
        if (d.boosting > 0) d.boosting = Math.max(0, d.boosting - dt);
        if (d.honkTimer > 0) d.honkTimer = Math.max(0, d.honkTimer - dt);
        // Frame-rate independent smoothing factor for a time constant in ms
        const ease = (tau: number) => 1 - Math.exp(-dt / tau);

        // Traffic keeps cruising even during the iris transition
        for (const t of d.traffic) t.x += (t.speed * dt) / 1000;

        // Start pulling away while the iris is still opening
        if (fade.dir !== 1 && d.arrivedFor === null) {
          let steerY = 0;
          if (input.up || virt.up) steerY -= 1;
          if (input.down || virt.down) steerY += 1;

          const wantFast =
            (d.direction === 1 && (input.right || virt.right)) ||
            (d.direction === -1 && (input.left || virt.left));
          const wantSlow =
            (d.direction === 1 && (input.left || virt.left)) ||
            (d.direction === -1 && (input.right || virt.right));

          const blockedLane = (lane: number, ahead: number, behind: number) =>
            d.traffic.some(
              (t) => t.lane - 1 === lane && t.x - d.distance < ahead && t.x - d.distance > -behind,
            );

          if (steerY === 0) {
            const current = Math.round(d.laneY);
            let targetLane = current;
            if (d.mode === "auto" && blockedLane(current, 260, 0)) {
              // Overtake through whichever neighbouring lane is clear
              const options = [current - 1, current + 1].filter((l) => l >= -1 && l <= 1);
              targetLane = options.find((l) => !blockedLane(l, 200, 70)) ?? current;
            }
            // Lane assist: glide to the lane center instead of stopping between lanes
            steerY = Math.max(-1, Math.min(1, (targetLane - d.laneY) * 2.4));
          }

          // Steering has inertia: lateral velocity eases toward the input
          d.laneVel += (steerY * 2.1 - d.laneVel) * ease(110);
          d.laneY += (d.laneVel * dt) / 1000;
          if (Math.abs(d.laneY) > 1.12) {
            d.laneY = Math.sign(d.laneY) * 1.12;
            d.laneVel = 0;
          }

          const cruise = d.mode === "auto" ? 420 : wantFast ? 430 : wantSlow ? 180 : 290;
          let targetSpeed = cruise + (d.boosting > 0 ? 190 : 0);

          // Follow slower traffic softly instead of snapping the speed down
          for (const t of d.traffic) {
            const gap = t.x - d.distance;
            const sameLane = Math.abs(t.lane - 1 - d.laneY) < 0.6;
            if (!sameLane || gap < 0 || gap > 170) continue;
            targetSpeed = Math.min(targetSpeed, Math.max(t.speed * 0.85, t.speed + (gap - 70) * 2.6));
            if (gap < 120 && !t.honked) {
              t.honked = true;
              d.honkTimer = 600;
              sound.playHorn(d.vehicle === "moto");
            }
            if (gap < 58) d.distance = t.x - 58;
          }

          // Brake smoothly into the destination
          const remaining = d.totalDistance - d.distance;
          targetSpeed = Math.min(targetSpeed, 18 + Math.sqrt(2 * 330 * Math.max(0, remaining)));

          const accelerating = targetSpeed > d.speed;
          d.braking = !accelerating && d.speed - targetSpeed > 12;
          d.speed += (targetSpeed - d.speed) * ease(accelerating ? 520 : 260);

          for (const pad of d.boostPads) {
            if (
              !pad.collected &&
              Math.abs(pad.x - d.distance) < 42 &&
              Math.abs(pad.lane - 1 - d.laneY) < 0.55
            ) {
              pad.collected = true;
              d.boosting = 950;
              sound.playBoost();
            }
          }

          if (input.wave && !waveLatch.current) {
            waveLatch.current = true;
            d.honkTimer = 650;
            sound.playHorn(d.vehicle === "moto");
          }
          if (input.interact && !interactLatch.current) {
            interactLatch.current = true;
            d.honkTimer = 650;
            sound.playHorn(d.vehicle === "moto");
          }

          const stepDist = (d.speed * dt) / 1000;
          d.distance = Math.min(d.totalDistance, d.distance + stepDist);
          d.scrollX += stepDist;

          const left = d.totalDistance - d.distance;
          if (left < 0.5 || (left < 6 && d.speed < 30)) {
            d.arrivedFor = 0;
            d.braking = true;
          }
        } else if (d.arrivedFor !== null) {
          // Roll to a stop, hold for a beat, then close the iris
          d.speed += (0 - d.speed) * ease(120);
          d.laneVel += (0 - d.laneVel) * ease(120);
          d.arrivedFor += dt;
          if (d.arrivedFor > 650) {
            d.braking = false;
            finishDriving();
          }
        }

        // The vehicle drifts back on screen when fast and forward when slowing
        const shiftTarget = -(d.speed - 290) * 0.14;
        d.screenShift += (shiftTarget - d.screenShift) * ease(700);

        ctx.clearRect(0, 0, viewW, viewH);
        drawDrivingScene(ctx, viewW, viewH, d, now);

        const lay = drivingLayout(viewW, viewH, d);
        drawTransition(ctx, fade, viewW, viewH, lay.playerX, lay.playerY - 10);

        raf = requestAnimationFrame(tick);
        return;
      }

      // Dymas works through the recipe station by station
      let barista: BaristaFrame | null = null;
      const crafting = dymasCraftingRef.current;
      if (crafting) {
        crafting.elapsed += dt;
        barista = baristaFrame(crafting);
        if (barista.stepIndex !== crafting.lastStep && barista.act) {
          crafting.lastStep = barista.stepIndex;
          sound.playBlip();
        }
        const sfxGap =
          barista.act === "blend"
            ? 220
            : barista.act === "ice"
              ? 330
              : barista.act === "pour"
                ? 420
                : 0;
        if (sfxGap && now - crafting.lastSfx > sfxGap) {
          crafting.lastSfx = now;
          if (barista.act === "pour") sound.playSip();
          else sound.playShaker();
        }

        if (barista.done) {
          dymasCraftingRef.current = null;
          barista = null;
          sound.playSparkle();
          counterDrinkRef.current = { drink: crafting.drink, x: crafting.serveX, empty: false };
          playerDrinkingRef.current = {
            drink: crafting.drink,
            elapsed: -650,
            fromX: crafting.serveX,
            fromY: BAR_COUNTER_TOP_Y,
            sipsPlayed: 0,
          };
        }
      }

      const drinking = playerDrinkingRef.current;
      if (drinking) {
        const wasWaiting = drinking.elapsed < 0;
        drinking.elapsed += dt;
        if (wasWaiting && drinking.elapsed >= 0) {
          // Azzam picks the glass up off the counter
          counterDrinkRef.current = null;
          player.facing = "down";
          player.waving = false;
        }
        const sips = drinkSipsDone(drinking.elapsed);
        if (sips > drinking.sipsPlayed) {
          drinking.sipsPlayed = sips;
          sound.playSip();
          if (sips === 3) setTimeout(() => sound.playSparkle(), 900);
        }

        if (drinking.elapsed >= DRINK_DURATION) {
          const finishedDrink = drinking.drink;
          playerDrinkingRef.current = null;
          counterDrinkRef.current = { drink: finishedDrink, x: drinking.fromX, empty: true };

          // Open reaction dialog!
          const drinkData = DRINKS[finishedDrink];
          onOpenDialogRef.current({
            speaker: drinkData.badge,
            subtitle: "AGL Barista Dymas",
            pages: [
              `Dymas: "${drinkData.serveDialog}"`,
              `Azzam: "${drinkData.reactionDialog}"`,
            ],
            tags: [drinkData.name, "Segar", "AGL Barista Dymas"],
          });
        }
      }

      const curZone = zoneRef.current;
      const curZoneCfg = TOWN_ZONES[curZone];

      const canMove =
        !overlayOpenRef.current &&
        fade.dir === 0 &&
        !playerDrinkingRef.current &&
        !dymasCraftingRef.current;
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

        const blockFn = inAgl
          ? isAglBlocked
          : inHouse
            ? isHouseBlocked
            : (x: number, y: number) => isBlockedInZone(curZone, x, y);
        const nextX = player.x + (player.vx * dt) / 1000;
        if (!blockFn(nextX, player.y)) player.x = nextX;
        const nextY = player.y + (player.vy * dt) / 1000;
        if (!blockFn(player.x, nextY)) player.y = nextY;

        if (Math.hypot(player.vx, player.vy) > 5) {
          sound.playStep();
        }

        // Auto-trigger manual driving when walking into a highway gate at the edge of the road
        if (!inHouse && !inAgl && gateCooldownRef.current <= 0) {
          if (
            curZoneCfg.leftGate &&
            dx < 0 &&
            player.x < 40 &&
            Math.abs(player.y - 350) < 34
          ) {
            startDriving(curZoneCfg.leftGate.toZone, "manual");
          } else if (
            curZoneCfg.rightGate &&
            dx > 0 &&
            player.x > curZoneCfg.width - 40 &&
            Math.abs(player.y - 350) < 34
          ) {
            startDriving(curZoneCfg.rightGate.toZone, "manual");
          }
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
        } else if (
          inAgl &&
          exitCooldownRef.current <= 0 &&
          dy > 0 &&
          Math.abs(player.x - 460) < 40 &&
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

      const mapW = inAgl ? AGL_WIDTH : inHouse ? HOUSE_WIDTH : curZoneCfg.width;
      const mapH = inAgl ? AGL_HEIGHT : inHouse ? HOUSE_HEIGHT : curZoneCfg.height;
      const cam = cameraRef.current;
      cam.x += (cameraTarget(player.x, viewW, mapW) - cam.x) * CAMERA_LERP;
      cam.y += (cameraTarget(player.y, viewH, mapH) - cam.y) * CAMERA_LERP;

      if (Math.hypot(player.x - lastReport.x, player.y - lastReport.y) > 2) {
        lastReport = { x: player.x, y: player.y };
        onPlayerPosRef.current(lastReport);
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

      if (sceneRef.current === "town") {
        // ==================== TOWN ZONE RENDER ====================
        const nearGate = findNearestGate(curZone, player.x, player.y);
        const nearPark = !nearGate && isNearParking(curZone, player.x, player.y);
        const nearBld =
          !nearGate && !nearPark
            ? findNearestBuildingInZone(curZone, player.x, player.y)
            : null;

        nearestGateRef.current = nearGate;
        nearParkingRef.current = nearPark;
        nearestBuildingRef.current = nearBld;

        const vIcon = vehicleRef.current === "car" ? "🚗" : "🏍️";
        const label = nearGate
          ? `${vIcon} Berkendara ke ${TOWN_ZONES[nearGate.toZone].shortLabel}`
          : nearPark
            ? "🅿️ Garasi & Pilih Kendaraan (Mobil / Motor)"
            : nearBld
              ? nearBld.id === "home"
                ? "Masuk ke Rumah"
                : nearBld.id === "agl"
                  ? "Masuk ke AGL 🪩"
                  : nearBld.name
              : null;

        if (label !== lastLabel) {
          lastLabel = label;
          onNearestLabelChangeRef.current(label);
        }

        const zoneBuildings = getZoneBuildings(curZone);
        const zoneNpcs = getZoneNpcs(curZone);
        const zoneDecor = getZoneDecor(curZone);

        for (const npc of zoneNpcs) {
          const state = npcStateRef.current[npc.id];
          if (state) {
            state.waving = Math.hypot(player.x - npc.x, player.y - npc.y) <= NPC_GREET_DISTANCE;
            state.animTime = state.waving ? state.animTime + dt : 0;
          }
        }

        drawWorldGround(worldCtx, curZone, vehicleRef.current, nearGate, nearPark);

        const items: TownDrawItem[] = [
          ...zoneDecor.map((d, index) => ({ kind: "decor" as const, sortY: d.y, index })),
          ...zoneBuildings.map((b, index) => ({ kind: "building" as const, sortY: b.y, index })),
          ...zoneNpcs.map((n, index) => ({ kind: "npc" as const, sortY: n.y, index })),
          { kind: "player", sortY: player.y },
        ];
        items.sort((a, b) => a.sortY - b.sortY);

        for (const item of items) {
          switch (item.kind) {
            case "decor":
              drawDecor(worldCtx, zoneDecor[item.index]);
              break;
            case "building":
              drawBuilding(
                worldCtx,
                zoneBuildings[item.index],
                nearBld?.id === zoneBuildings[item.index].id,
              );
              break;
            case "npc":
              drawNpc(
                worldCtx,
                zoneNpcs[item.index],
                npcStateRef.current[zoneNpcs[item.index].id],
              );
              break;
            case "player":
              drawPlayer(worldCtx, player, playerDrinkingRef.current);
          }
        }

        if (!overlayOpenRef.current) {
          if (nearGate) {
            drawHint(
              ctx,
              nearGate.x + (nearGate.direction === "right" ? -52 : 52) - cam.x,
              nearGate.y - cam.y + 78,
              `E / Jalan terus: Naik ${vehicleRef.current === "car" ? "Mobil 🚗" : "Motor 🏍️"}`,
            );
          } else if (nearPark) {
            drawHint(
              ctx,
              curZoneCfg.parkingSpot.x - cam.x,
              curZoneCfg.parkingSpot.y - cam.y - 42,
              "E / klik: Pilih Mobil 🚗 / Motor 🏍️ & Berangkat",
            );
          } else if (nearBld) {
            const r = getBuildingBounds(nearBld);
            const hintText =
              nearBld.id === "home"
                ? "E / klik untuk masuk rumah 🏠"
                : nearBld.id === "agl"
                  ? "E / klik untuk masuk AGL 🪩"
                  : "E / klik untuk buka";
            drawHint(ctx, nearBld.x - cam.x, r.top - cam.y - 4, hintText);
          }
        }
      } else if (sceneRef.current === "agl") {
        // ==================== AGL DISCO INTERIOR RENDER ====================
        const busy = !!dymasCraftingRef.current || !!playerDrinkingRef.current;
        let bestAglTarget: AglTarget | null = null;
        let bestDist = 44;
        const counter = aglFurniture.find((f) => f.id === "bar_counter");
        if (!busy && seatRef.current?.id === "bar_stools" && counter) {
          bestAglTarget = { kind: "furniture", item: counter };
        } else if (!busy) {
          for (const npc of aglNpcs) {
            const d = Math.hypot(player.x - npc.x, player.y - (npc.talkY ?? npc.y + 4));
            if (d < bestDist) {
              bestDist = d;
              bestAglTarget = { kind: "npc", npc };
            }
          }
          for (const f of aglFurniture) {
            if (f.interactive === false) continue;
            if (
              f.id === "bar_counter" &&
              bestAglTarget?.kind === "npc" &&
              bestAglTarget.npc.id === "dymas"
            ) {
              continue;
            }
            const left = f.x - f.width / 2;
            const right = f.x + f.width / 2;
            const top = f.y - f.height;
            const bottom = f.y + 6;
            const ddx = Math.max(left - player.x, 0, player.x - right);
            const ddy = Math.max(top - player.y, 0, player.y - bottom);
            const d = Math.hypot(ddx, ddy) + (f.id === "bar_counter" ? 0 : 6);
            if (d < bestDist) {
              bestDist = d;
              bestAglTarget = { kind: "furniture", item: f };
            }
          }
        }

        nearestAglRef.current = bestAglTarget;
        const label = bestAglTarget
          ? bestAglTarget.kind === "npc"
            ? bestAglTarget.npc.id === "dymas"
              ? "Pesan Minuman ke Dymas 🥤"
              : `Ngobrol dengan ${bestAglTarget.npc.name}`
            : bestAglTarget.item.id === "bar_counter"
              ? "Pesan Minuman ke Dymas 🥤"
              : bestAglTarget.item.name
          : null;
        if (label !== lastLabel) {
          lastLabel = label;
          onNearestLabelChangeRef.current(label);
        }

        drawAglGround(worldCtx);

        const aItems: AglDrawItem[] = [
          ...aglFurniture.map((f, index) => ({
            kind: "furniture" as const,
            sortY: f.sortY ?? f.y,
            index,
          })),
          ...aglNpcs.map((n, index) => ({
            kind: "npc" as const,
            sortY: n.y,
            index,
          })),
          { kind: "player", sortY: player.y },
        ];
        aItems.sort((a, b) => a.sortY - b.sortY);

        const aglState = {
          barista,
          order: dymasCraftingRef.current?.drink ?? null,
          counterDrink: counterDrinkRef.current,
        };
        const dymasTargeted =
          (bestAglTarget?.kind === "npc" && bestAglTarget.npc.id === "dymas") ||
          (bestAglTarget?.kind === "furniture" && bestAglTarget.item.id === "bar_counter");

        for (const it of aItems) {
          switch (it.kind) {
            case "furniture": {
              const f = aglFurniture[it.index];
              const isNear =
                bestAglTarget?.kind === "furniture" && bestAglTarget.item.id === f.id;
              drawAglFurnitureItem(worldCtx, f, isNear, aglState);
              break;
            }
            case "npc": {
              const n = aglNpcs[it.index];
              const isNear =
                (bestAglTarget?.kind === "npc" && bestAglTarget.npc.id === n.id) ||
                (n.id === "dymas" && dymasTargeted);
              drawAglNpc(worldCtx, n, isNear, aglState);
              break;
            }
            case "player":
              drawPlayer(worldCtx, player, playerDrinkingRef.current);
              break;
          }
        }

        drawAglLighting(worldCtx);

        if (!overlayOpenRef.current && !busy) {
          const below = player.y - cam.y + 30;
          if (player.pose !== "stand" && !dymasTargeted) {
            drawHint(ctx, player.x - cam.x, below, "E / tombol arah untuk berdiri");
          } else if (dymasTargeted) {
            drawHint(ctx, player.x - cam.x, below, "E / klik: Pesan Minuman ke Dymas 🥤");
          } else if (bestAglTarget?.kind === "npc") {
            drawHint(
              ctx,
              player.x - cam.x,
              below,
              `E / klik: Ngobrol dengan ${bestAglTarget.npc.name}`,
            );
          } else if (bestAglTarget?.kind === "furniture") {
            const f = bestAglTarget.item;
            const text = f.isExit
              ? "E / klik untuk keluar ke kota"
              : f.action === "sit"
                ? "E / klik: duduk santai"
                : `E / klik: ${f.name}`;
            drawHint(ctx, f.x - cam.x, aglFurnitureTopY(f) - cam.y - 6, text);
          }
        }
      } else {
        // ==================== HOUSE INTERIOR RENDER ====================
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
          onNearestLabelChangeRef.current(label);
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
              const isNear = Math.hypot(player.x - st.x, player.y - st.y) <= 78;
              drawCat(worldCtx, c, st, isNear);
              break;
            }
            case "player":
              drawPlayer(worldCtx, player, playerDrinkingRef.current);
              if (
                player.pose === "sit" &&
                seatRef.current &&
                "kind" in seatRef.current &&
                seatRef.current.kind === "laptop_desk"
              ) {
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
            drawHint(
              ctx,
              player.x - cam.x,
              player.y - cam.y + (player.pose === "sleep" ? 72 : -52),
              text,
            );
          } else if (bestTarget?.kind === "furniture") {
            const f = bestTarget.item;
            const verb =
              f.action === "sit"
                ? "duduk"
                : f.action === "laptop"
                  ? "duduk di laptop"
                  : f.action === "bed"
                    ? "kasur"
                    : f.name;
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

      drawTransition(
        ctx,
        fade,
        viewW,
        viewH,
        player.x - cameraRef.current.x,
        player.y - cameraRef.current.y - 24,
      );

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [finishDriving, standUp, startDriving, startWave, transitionToScene, triggerInteract]);

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

/** Scene transition overlay: a flat fade, or an iris that closes around (cx, cy) */
function drawTransition(
  ctx: CanvasRenderingContext2D,
  fade: { alpha: number; style?: "fade" | "iris" },
  viewW: number,
  viewH: number,
  cx: number,
  cy: number,
): void {
  if (fade.alpha <= 0.01) return;
  if (fade.style !== "iris") {
    ctx.fillStyle = `rgba(18, 12, 8, ${fade.alpha})`;
    ctx.fillRect(0, 0, viewW, viewH);
    return;
  }
  const t = fade.alpha * fade.alpha * (3 - 2 * fade.alpha);
  const maxR = Math.hypot(Math.max(cx, viewW - cx), Math.max(cy, viewH - cy)) + 20;
  const r = maxR * (1 - t);
  ctx.save();
  ctx.fillStyle = "#120c08";
  ctx.beginPath();
  ctx.rect(0, 0, viewW, viewH);
  if (r > 0.5) ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  if (r > 0.5) {
    // Soft warm rim on the iris edge
    const rim = ctx.createRadialGradient(cx, cy, Math.max(0, r - 26), cx, cy, r);
    rim.addColorStop(0, "rgba(18, 12, 8, 0)");
    rim.addColorStop(1, "rgba(18, 12, 8, 0.55)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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
