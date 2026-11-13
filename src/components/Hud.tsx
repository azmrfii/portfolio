"use client";

import {
  HOUSE_HEIGHT,
  HOUSE_ROOMS,
  HOUSE_WIDTH,
  houseCats,
  houseFurniture,
} from "@/data/houseData";
import {
  JUMP_TARGETS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  bridge,
  buildings,
  pond,
  road,
} from "@/data/worldData";
import { useState } from "react";

interface HudProps {
  scene: "town" | "house";
  playerPos: { x: number; y: number };
  nearestLabel: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onJump: (x: number, y: number) => void;
  onExitHouse: () => void;
}

const KIND_COLOR = {
  home: "#c2553a",
  school: "#f59e0b",
  office: "#475569",
  shop: "#92400e",
  hangout: "#a855f7",
} as const;

export default function Hud({
  scene,
  playerPos,
  nearestLabel,
  muted,
  onToggleMute,
  onJump,
  onExitHouse,
}: HudProps) {
  const [mapOpen, setMapOpen] = useState(true);

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
        <div className="pixel-panel !px-3 !py-2 max-w-[290px]">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-pixel text-[10px] leading-relaxed text-[#3b2a1a]">
              {scene === "house" ? "🏠 Dalam Rumah Azzam" : "Azzam's Town"}
            </h1>
            <button
              type="button"
              onClick={onToggleMute}
              className="pointer-events-auto pixel-btn !px-2 !py-0.5 text-[10px]"
              aria-label={muted ? "Nyalakan musik" : "Matikan musik"}
              title={muted ? "Nyalakan musik BGM" : "Matikan musik BGM"}
            >
              {muted ? "🔇 Mute" : "🔊 BGM"}
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[#6b4f3a]">
            {nearestLabel ? (
              <>
                <b>{nearestLabel}</b> · tekan E / klik
              </>
            ) : scene === "house" ? (
              "Keliling perabot & sapa Gray Pi, Kimmy, Boba · E periksa"
            ) : (
              "WASD / panah jalan · Space lambai · E buka"
            )}
          </p>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-20 flex w-[184px] flex-col items-end gap-2 sm:right-4 sm:top-4 sm:w-[210px]">
        <div className="pixel-panel w-full !p-2">
          <button
            type="button"
            onClick={() => setMapOpen((v) => !v)}
            className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5b3a29]"
          >
            <span>{scene === "house" ? "Denah Rumah" : "Peta Kota"}</span>
            <span aria-hidden>{mapOpen ? "▾" : "▸"}</span>
          </button>

          {mapOpen &&
            (scene === "town" ? (
              <svg
                viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
                className="mt-1.5 block w-full rounded-sm border-2 border-[#5b3a29] bg-[#74bf55]"
                role="img"
                aria-label="Peta kota"
              >
                <polyline
                  points={road.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#4a4f59"
                  strokeWidth={34}
                  strokeLinejoin="miter"
                />
                <ellipse cx={pond.x} cy={pond.y} rx={pond.rx} ry={pond.ry} fill="#3fb3e6" />
                <rect
                  x={bridge.x - bridge.width / 2}
                  y={bridge.y - bridge.deckHeight / 2}
                  width={bridge.width}
                  height={bridge.deckHeight}
                  fill="#b98552"
                />
                {buildings.map((b) => (
                  <rect
                    key={b.id}
                    x={b.x - b.visual.width / 2}
                    y={b.y - 46}
                    width={b.visual.width}
                    height={46}
                    rx={6}
                    fill={KIND_COLOR[b.kind]}
                    stroke="#2e211b"
                    strokeWidth={6}
                  >
                    <title>{b.name}</title>
                  </rect>
                ))}
                <circle
                  cx={playerPos.x}
                  cy={playerPos.y}
                  r={22}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={8}
                />
              </svg>
            ) : (
              <svg
                viewBox={`0 0 ${HOUSE_WIDTH} ${HOUSE_HEIGHT}`}
                className="mt-1.5 block w-full rounded-sm border-2 border-[#5b3a29] bg-[#2a1f18]"
                role="img"
                aria-label="Denah dalam rumah"
              >
                {HOUSE_ROOMS.map((r) => (
                  <rect
                    key={r.id}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill={
                      r.floor === "gym" ? "#4b5563" : r.floor === "dark_wood" ? "#9a6a45" : "#d2a26f"
                    }
                    stroke="#5b3a29"
                    strokeWidth={8}
                  />
                ))}
                {houseFurniture.map((f) => (
                  <rect
                    key={f.id}
                    x={f.x - f.width / 2}
                    y={f.y - f.height}
                    width={f.width}
                    height={f.height}
                    rx={4}
                    fill={f.isExit ? "#f59e0b" : "#7c4a24"}
                  />
                ))}
                {houseCats.map((c) => (
                  <circle key={c.id} cx={c.homeX} cy={c.homeY} r={14} fill={c.collarColor} />
                ))}
                <circle
                  cx={playerPos.x}
                  cy={playerPos.y}
                  r={18}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={6}
                />
              </svg>
            ))}
        </div>

        {scene === "town" ? (
          <div className="grid w-full grid-cols-2 gap-1.5">
            {JUMP_TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onJump(t.x, t.y)}
                className="pixel-btn px-1.5 py-1 text-[9px]"
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onExitHouse}
            className="pixel-btn w-full py-1.5 text-[10px] !bg-[#fde68a]"
          >
            🚪 Keluar ke Kota
          </button>
        )}
      </div>
    </>
  );
}
