"use client";

import { PLAYER_START, type BuildingData } from "@/data/worldData";
import { sound } from "@/lib/audio/chiptune";
import { useCallback, useEffect, useRef, useState } from "react";
import BuildingModal from "./BuildingModal";
import GameCanvas, { type GameCanvasHandle } from "./GameCanvas";
import Hud from "./Hud";
import RpgDialogBox, { type RpgDialogData } from "./RpgDialogBox";
import VirtualControls from "./VirtualControls";

export default function PortfolioGame() {
  const apiRef = useRef<GameCanvasHandle | null>(null);
  const [scene, setScene] = useState<"town" | "house">("town");
  const [playerPos, setPlayerPos] = useState(PLAYER_START);
  const [nearestLabel, setNearestLabel] = useState<string | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<BuildingData | null>(null);
  const [activeDialog, setActiveDialog] = useState<RpgDialogData | null>(null);
  const [muted, setMuted] = useState(() => sound.isMuted());

  const closeModal = useCallback(() => setActiveBuilding(null), []);
  const closeDialog = useCallback(() => setActiveDialog(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        closeDialog();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDialog, closeModal]);

  const handleToggleMute = useCallback(() => {
    const next = sound.toggleMute();
    setMuted(next);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#6fbf5a]">
      <GameCanvas
        apiRef={apiRef}
        scene={scene}
        onSceneChange={setScene}
        overlayOpen={!!activeBuilding || !!activeDialog}
        onNearestLabelChange={setNearestLabel}
        onOpenBuilding={setActiveBuilding}
        onOpenDialog={setActiveDialog}
        onPlayerPos={setPlayerPos}
      />

      <Hud
        scene={scene}
        playerPos={playerPos}
        nearestLabel={nearestLabel}
        muted={muted}
        onToggleMute={handleToggleMute}
        onJump={(x, y) => apiRef.current?.jumpTo(x, y)}
        onExitHouse={() => apiRef.current?.exitHouse()}
      />

      <VirtualControls
        onDir={(dir, pressed) => apiRef.current?.setVirtual(dir, pressed)}
        onWave={() => apiRef.current?.triggerWave()}
        onInteract={() => apiRef.current?.triggerInteract()}
      />

      <BuildingModal building={activeBuilding} onClose={closeModal} />
      <RpgDialogBox
        key={activeDialog ? activeDialog.speaker : "closed"}
        dialog={activeDialog}
        onClose={closeDialog}
      />
    </div>
  );
}
