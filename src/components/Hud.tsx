"use client";

import {
  AGL_HEIGHT,
  AGL_WIDTH,
  aglFurniture,
  aglNpcs,
} from "@/data/aglData";
import {
  HOUSE_HEIGHT,
  HOUSE_ROOMS,
  HOUSE_WIDTH,
  houseCats,
  houseFurniture,
} from "@/data/houseData";
import {
  TOWN_ZONES,
  ZONE_ORDER,
  getZoneBuildings,
  type TownZone,
  type VehicleType,
} from "@/data/worldData";
import { useState } from "react";

interface HudProps {
  scene: "town" | "house" | "agl" | "driving";
  zone: TownZone;
  vehicle: VehicleType;
  playerPos: { x: number; y: number };
  nearestLabel: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onSelectVehicle: (v: VehicleType) => void;
  onTravelToZone: (target: TownZone) => void;
  onSkipDriving: () => void;
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
  zone,
  vehicle,
  playerPos,
  nearestLabel,
  muted,
  onToggleMute,
  onSelectVehicle,
  onTravelToZone,
  onSkipDriving,
  onExitHouse,
}: HudProps) {
  const [mapOpen, setMapOpen] = useState(true);
  const currentZone = TOWN_ZONES[zone];
  const zoneBuildings = getZoneBuildings(zone);

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
        <div className="pixel-panel !px-3 !py-2 max-w-[300px]">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-pixel text-[9.5px] leading-relaxed text-[#3b2a1a]">
              {scene === "house"
                ? "🏠 Dalam Rumah Azzam"
                : scene === "agl"
                  ? "🪩 AGL — Diskotik & Bar"
                  : scene === "driving"
                    ? vehicle === "car"
                      ? "🚗 Perjalanan Mobil"
                      : "🏍️ Perjalanan Motor"
                    : currentZone.title}
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
            {scene === "driving" ? (
              "W/S pindah jalur · D/→ gas ngebut · Space klakson 📯"
            ) : nearestLabel ? (
              <>
                <b>{nearestLabel}</b> · tekan E / klik
              </>
            ) : scene === "house" ? (
              "Keliling perabot & sapa Gray Pi, Kimmy, Boba · E periksa"
            ) : scene === "agl" ? (
              "Vibing bareng teman rumah & DJ Valdy · E ngobrol"
            ) : (
              `${currentZone.subtitle} · WASD jalan · E interaksi`
            )}
          </p>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-20 flex w-[196px] flex-col items-end gap-2 sm:right-4 sm:top-4 sm:w-[224px]">
        {scene !== "driving" && (
          <div className="pixel-panel w-full !p-2">
            <button
              type="button"
              onClick={() => setMapOpen((v) => !v)}
              className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5b3a29]"
            >
              <span>
                {scene === "house"
                  ? "Denah Rumah"
                  : scene === "agl"
                    ? "Denah AGL"
                    : `Peta: ${currentZone.shortLabel}`}
              </span>
              <span aria-hidden>{mapOpen ? "▾" : "▸"}</span>
            </button>

            {mapOpen &&
              (scene === "town" ? (
                <svg
                  viewBox={`0 0 ${currentZone.width} ${currentZone.height}`}
                  className="mt-1.5 block w-full rounded-sm border-2 border-[#5b3a29] bg-[#74bf55]"
                  role="img"
                  aria-label="Peta zona"
                >
                  <polyline
                    points={currentZone.road.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#4a4f59"
                    strokeWidth={36}
                    strokeLinejoin="miter"
                  />
                  {currentZone.pond && (
                    <ellipse
                      cx={currentZone.pond.x}
                      cy={currentZone.pond.y}
                      rx={currentZone.pond.rx}
                      ry={currentZone.pond.ry}
                      fill="#3fb3e6"
                    />
                  )}
                  <rect
                    x={currentZone.parkingSpot.x - 42}
                    y={currentZone.parkingSpot.y - 22}
                    width={84}
                    height={44}
                    rx={6}
                    fill="#1e3a8a"
                    stroke="#93c5fd"
                    strokeWidth={4}
                  />
                  {zoneBuildings.map((b) => (
                    <rect
                      key={b.id}
                      x={b.x - b.visual.width / 2}
                      y={b.y - 48}
                      width={b.visual.width}
                      height={48}
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
              ) : scene === "house" ? (
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
                        r.floor === "gym"
                          ? "#4b5563"
                          : r.floor === "dark_wood"
                            ? "#9a6a45"
                            : "#d2a26f"
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
              ) : (
                <svg
                  viewBox={`0 0 ${AGL_WIDTH} ${AGL_HEIGHT}`}
                  className="mt-1.5 block w-full rounded-sm border-2 border-[#ec4899] bg-[#0c0814]"
                  role="img"
                  aria-label="Denah diskotik AGL"
                >
                  <rect
                    x={90}
                    y={70}
                    width={280}
                    height={120}
                    rx={4}
                    fill="#261a3d"
                    stroke="#8b5cf6"
                    strokeWidth={4}
                  />
                  <rect
                    x={560}
                    y={70}
                    width={280}
                    height={125}
                    rx={4}
                    fill="#201733"
                    stroke="#ec4899"
                    strokeWidth={4}
                  />
                  <rect
                    x={330}
                    y={230}
                    width={260}
                    height={170}
                    rx={6}
                    fill="#3b1e54"
                    stroke="#ec4899"
                    strokeWidth={6}
                  />
                  {aglFurniture.map((f) => (
                    <rect
                      key={f.id}
                      x={f.x - f.width / 2}
                      y={f.y - f.height}
                      width={f.width}
                      height={f.height}
                      rx={3}
                      fill={f.isExit ? "#facc15" : "#6366f1"}
                    />
                  ))}
                  {aglNpcs.map((n) => (
                    <circle
                      key={n.id}
                      cx={n.x}
                      cy={n.y}
                      r={12}
                      fill="#ec4899"
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                  <circle
                    cx={playerPos.x}
                    cy={playerPos.y}
                    r={18}
                    fill="#facc15"
                    stroke="#fff"
                    strokeWidth={6}
                  />
                </svg>
              ))}
          </div>
        )}

        {scene === "town" ? (
          <div className="pixel-panel flex w-full flex-col gap-1.5 !p-2">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#5b3a29]">
              <span>Kendaraan:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onSelectVehicle("car")}
                  className={`pixel-btn !px-2 !py-0.5 text-[9px] ${
                    vehicle === "car" ? "!bg-[#fde68a] font-extrabold" : "opacity-80"
                  }`}
                >
                  🚗 Mobil
                </button>
                <button
                  type="button"
                  onClick={() => onSelectVehicle("moto")}
                  className={`pixel-btn !px-2 !py-0.5 text-[9px] ${
                    vehicle === "moto" ? "!bg-[#fde68a] font-extrabold" : "opacity-80"
                  }`}
                >
                  🏍️ Motor
                </button>
              </div>
            </div>

            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#5b3a29]">
              Pindah Map ({vehicle === "car" ? "Naik Mobil" : "Naik Motor"}):
            </div>
            <div className="flex flex-col gap-1">
              {ZONE_ORDER.map((zId, idx) => {
                const z = TOWN_ZONES[zId];
                const isCurrent = zId === zone;
                const icon = idx === 0 ? "🏠" : idx === 1 ? "🎓" : "💼";
                return (
                  <button
                    key={zId}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onTravelToZone(zId)}
                    className={`pixel-btn flex w-full items-center justify-between px-2 py-1 text-left text-[9.5px] ${
                      isCurrent
                        ? "!bg-[#bbf7d0] !text-[#14532d] cursor-default font-extrabold"
                        : "hover:!bg-[#fde68a]"
                    }`}
                  >
                    <span>
                      {icon} Map {idx + 1}: {z.shortLabel}
                    </span>
                    <span className="text-[8.5px]">
                      {isCurrent ? "● Di Sini" : "Gas ➔"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : scene === "driving" ? (
          <button
            type="button"
            onClick={onSkipDriving}
            className="pixel-btn w-full py-1.5 text-[10px] !bg-[#fde68a]"
          >
            ⚡ Langsung Sampai Tujuan
          </button>
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
