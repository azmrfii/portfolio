"use client";

import {
  PLAYER_START,
  type BuildingData,
  type TownZone,
  type VehicleType,
} from "@/data/worldData";
import { sound } from "@/lib/audio/chiptune";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import BuildingModal from "./BuildingModal";
import GameCanvas, { type GameCanvasHandle } from "./GameCanvas";
import Hud from "./Hud";
import RpgDialogBox, { type RpgDialogData } from "./RpgDialogBox";
import VirtualControls from "./VirtualControls";

export default function PortfolioGame() {
  const apiRef = useRef<GameCanvasHandle | null>(null);
  const [scene, setScene] = useState<"town" | "house" | "agl" | "driving">("town");
  const [zone, setZone] = useState<TownZone>("home_zone");
  const [vehicle, setVehicle] = useState<VehicleType>("car");
  const [playerPos, setPlayerPos] = useState(PLAYER_START);
  const [nearestLabel, setNearestLabel] = useState<string | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<BuildingData | null>(null);
  const [activeDialog, setActiveDialog] = useState<RpgDialogData | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const dialogRef = useRef<RpgDialogData | null>(null);
  const muted = useSyncExternalStore(
    sound.subscribe,
    sound.getSnapshot,
    sound.getServerSnapshot,
  );

  const openDialog = useCallback((dialog: RpgDialogData) => {
    dialogRef.current = dialog;
    setActiveDialog(dialog);
    setDialogKey((k) => k + 1);
  }, []);

  const closeModal = useCallback(() => setActiveBuilding(null), []);

  const closeDialog = useCallback(() => {
    const d = dialogRef.current;
    if (!d) return;
    dialogRef.current = null;
    setActiveDialog(null);
    d.onClose?.();
  }, []);

  const chooseDialog = useCallback((id: string) => {
    const d = dialogRef.current;
    if (!d) return;
    dialogRef.current = null;
    setActiveDialog(null);
    // May open a follow-up dialog via openDialog
    d.onChoice?.(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  const handleToggleMute = useCallback(() => {
    sound.toggleMute();
  }, []);

  const handleSelectVehicle = useCallback((v: VehicleType) => {
    sound.unlockAndStart();
    sound.playBlip();
    setVehicle(v);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#6fbf5a]">
      <GameCanvas
        apiRef={apiRef}
        scene={scene}
        onSceneChange={setScene}
        zone={zone}
        onZoneChange={setZone}
        vehicle={vehicle}
        onVehicleChange={setVehicle}
        overlayOpen={!!activeBuilding || !!activeDialog}
        onNearestLabelChange={setNearestLabel}
        onOpenBuilding={setActiveBuilding}
        onOpenDialog={openDialog}
        onPlayerPos={setPlayerPos}
      />

      <Hud
        scene={scene}
        zone={zone}
        vehicle={vehicle}
        playerPos={playerPos}
        nearestLabel={nearestLabel}
        muted={muted}
        onToggleMute={handleToggleMute}
        onSelectVehicle={handleSelectVehicle}
        onTravelToZone={(targetZone) => apiRef.current?.travelToZone(targetZone, "auto")}
        onSkipDriving={() => apiRef.current?.skipDriving()}
        onExitHouse={() => apiRef.current?.exitHouse()}
      />

      <VirtualControls
        onDir={(dir, pressed) => apiRef.current?.setVirtual(dir, pressed)}
        onWave={() => apiRef.current?.triggerWave()}
        onInteract={() => apiRef.current?.triggerInteract()}
      />

      <BuildingModal building={activeBuilding} onClose={closeModal} />
      <RpgDialogBox
        key={dialogKey}
        dialog={activeDialog}
        onClose={closeDialog}
        onChoose={chooseDialog}
      />
    </div>
  );
}
