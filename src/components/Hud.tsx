"use client";

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

const SHORT_MAP_BTN: Record<TownZone, { icon: string; label: string }> = {
  home_zone: { icon: "🏠", label: "Rumah" },
  edu_zone: { icon: "🎓", label: "Sekolah" },
  work_zone: { icon: "💼", label: "Kantor" },
};

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
  const [panelOpen, setPanelOpen] = useState(false);
  const currentZone = TOWN_ZONES[zone];
  const zoneBuildings = getZoneBuildings(zone);

  return (
    <>
      <div className="pointer-events-none absolute left-2.5 top-2.5 z-20 sm:left-4 sm:top-4">
        <div className="pixel-panel !px-2.5 !py-1.5 max-w-[195px] sm:!px-3 sm:!py-2 sm:max-w-[275px]">
          <div className="flex items-center justify-between gap-1.5">
            <h1 className="font-pixel text-[8.5px] sm:text-[9.5px] leading-snug text-[#3b2a1a] truncate">
              {scene === "house"
                ? "🏠 Rumah Azzam"
                : scene === "agl"
                  ? "🪩 AGL Disco & Bar"
                  : scene === "driving"
                    ? vehicle === "car"
                      ? "🚗 Naik Mobil"
                      : "🏍️ Naik Motor"
                    : currentZone.shortLabel}
            </h1>
            <button
              type="button"
              onClick={onToggleMute}
              className="pointer-events-auto pixel-btn shrink-0 !px-1.5 !py-0.5 text-[9px]"
              aria-label={muted ? "Nyalakan musik" : "Matikan musik"}
              title={muted ? "Nyalakan musik BGM" : "Matikan musik BGM"}
            >
              {muted ? "🔇" : "🔊 BGM"}
            </button>
          </div>
          <p className="mt-0.5 text-[10px] sm:text-[11px] leading-tight text-[#6b4f3a] line-clamp-2">
            {scene === "driving" ? (
              "W/S jalur · D/→ gas · Space klakson 📯"
            ) : nearestLabel ? (
              <>
                <b>{nearestLabel}</b> · E / klik
              </>
            ) : scene === "house" ? (
              "Keliling perabot & kucing · E periksa"
            ) : scene === "agl" ? (
              "Vibing bareng teman & DJ · E ngobrol"
            ) : (
              "WASD jalan · E buka · Garasi pilih mobil/motor"
            )}
          </p>
        </div>
      </div>

      <div className="absolute right-2.5 top-2.5 z-20 flex w-[148px] flex-col items-end gap-1.5 sm:right-4 sm:top-4 sm:w-[192px]">
        {scene === "driving" ? (
          <button
            type="button"
            onClick={onSkipDriving}
            className="pixel-btn w-full py-1.5 text-[9.5px] !bg-[#fde68a]"
          >
            ⚡ Langsung Sampai
          </button>
        ) : scene === "house" || scene === "agl" ? (
          <button
            type="button"
            onClick={onExitHouse}
            className="pixel-btn w-full py-1.5 text-[9.5px] !bg-[#fde68a]"
          >
            🚪 Keluar ke Kota
          </button>
        ) : (
          <div className="pixel-panel w-full !p-1.5 sm:!p-2">
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="flex w-full items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-[#5b3a29]"
            >
              <span className="truncate">
                🗺️ Peta & Pindah Map
              </span>
              <span aria-hidden className="ml-1 shrink-0">
                {panelOpen ? "▾" : "▸"}
              </span>
            </button>

            {/* Quick 1-row map switch pills always accessible without blocking the screen */}
            {!panelOpen && (
              <div className="mt-1 grid grid-cols-3 gap-1">
                {ZONE_ORDER.map((zId) => {
                  const isCurrent = zId === zone;
                  const info = SHORT_MAP_BTN[zId];
                  return (
                    <button
                      key={zId}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => onTravelToZone(zId)}
                      title={`Pergi ke ${TOWN_ZONES[zId].title}`}
                      className={`pixel-btn !px-1 !py-0.5 text-[8.5px] text-center truncate ${
                        isCurrent
                          ? "!bg-[#bbf7d0] !text-[#14532d] font-extrabold cursor-default"
                          : "hover:!bg-[#fde68a]"
                      }`}
                    >
                      {info.icon} {info.label}
                    </button>
                  );
                })}
              </div>
            )}

            {panelOpen && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                <svg
                  viewBox={`0 0 ${currentZone.width} ${currentZone.height}`}
                  className="block w-full rounded-sm border-2 border-[#5b3a29] bg-[#74bf55]"
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
                  {currentZone.garden && (
                    <rect
                      x={currentZone.garden.x - currentZone.garden.width / 2}
                      y={currentZone.garden.y - currentZone.garden.height / 2}
                      width={currentZone.garden.width}
                      height={currentZone.garden.height}
                      rx={8}
                      fill="#ec4899"
                      stroke="#bbf7d0"
                      strokeWidth={4}
                    />
                  )}
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

                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectVehicle("car")}
                    className={`pixel-btn !px-1.5 !py-0.5 text-[8.5px] ${
                      vehicle === "car" ? "!bg-[#fde68a] font-extrabold" : "opacity-80"
                    }`}
                  >
                    🚗 Mobil
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectVehicle("moto")}
                    className={`pixel-btn !px-1.5 !py-0.5 text-[8.5px] ${
                      vehicle === "moto" ? "!bg-[#fde68a] font-extrabold" : "opacity-80"
                    }`}
                  >
                    🏍️ Motor
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {ZONE_ORDER.map((zId) => {
                    const isCurrent = zId === zone;
                    const info = SHORT_MAP_BTN[zId];
                    return (
                      <button
                        key={zId}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          setPanelOpen(false);
                          onTravelToZone(zId);
                        }}
                        className={`pixel-btn !px-1 !py-1 text-[8.5px] text-center truncate ${
                          isCurrent
                            ? "!bg-[#bbf7d0] !text-[#14532d] font-extrabold cursor-default"
                            : "hover:!bg-[#fde68a]"
                        }`}
                      >
                        {info.icon} {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
