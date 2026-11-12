"use client";

import { PLAYER_START, type BuildingData } from "@/data/worldData";
import { useCallback, useEffect, useRef, useState } from "react";
import BuildingModal from "./BuildingModal";
import GameCanvas, { type GameCanvasHandle } from "./GameCanvas";
import Hud from "./Hud";
import VirtualControls from "./VirtualControls";

export default function PortfolioGame() {
  const apiRef = useRef<GameCanvasHandle | null>(null);
  const [playerPos, setPlayerPos] = useState(PLAYER_START);
  const [nearest, setNearest] = useState<BuildingData | null>(null);
  const [active, setActive] = useState<BuildingData | null>(null);

  const closeModal = useCallback(() => setActive(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#6fbf5a]">
      <GameCanvas
        apiRef={apiRef}
        modalOpen={!!active}
        onNearestChange={setNearest}
        onOpenBuilding={setActive}
        onPlayerPos={setPlayerPos}
      />

      <Hud
        playerPos={playerPos}
        nearestLabel={nearest?.name ?? null}
        onJump={(x, y) => apiRef.current?.jumpTo(x, y)}
      />

      <VirtualControls
        onDir={(dir, pressed) => apiRef.current?.setVirtual(dir, pressed)}
        onWave={() => apiRef.current?.triggerWave()}
        onInteract={() => apiRef.current?.triggerInteract()}
      />

      <BuildingModal building={active} onClose={closeModal} />
    </div>
  );
}
