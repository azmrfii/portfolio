"use client";

interface VirtualControlsProps {
  onDir: (dir: "left" | "right" | "up" | "down", pressed: boolean) => void;
  onWave: () => void;
  onInteract: () => void;
}

export default function VirtualControls({
  onDir,
  onWave,
  onInteract,
}: VirtualControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 sm:p-5 md:hidden">
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
        <span />
        <PadButton label="▲" ariaLabel="Atas" onPress={() => onDir("up", true)} onRelease={() => onDir("up", false)} />
        <span />
        <PadButton label="◀" ariaLabel="Kiri" onPress={() => onDir("left", true)} onRelease={() => onDir("left", false)} />
        <PadButton label="▼" ariaLabel="Bawah" onPress={() => onDir("down", true)} onRelease={() => onDir("down", false)} />
        <PadButton label="▶" ariaLabel="Kanan" onPress={() => onDir("right", true)} onRelease={() => onDir("right", false)} />
      </div>
      <div className="pointer-events-auto flex gap-2">
        <button type="button" className="pixel-btn h-14 min-w-14 text-[10px]" onClick={onWave}>
          Wave
        </button>
        <button
          type="button"
          className="pixel-btn h-14 min-w-14 text-[10px] !bg-[#e8f5d8]"
          onClick={onInteract}
        >
          E
        </button>
      </div>
    </div>
  );
}

function PadButton({
  label,
  ariaLabel,
  onPress,
  onRelease,
}: {
  label: string;
  ariaLabel: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="pixel-btn h-12 w-12 text-base select-none touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).setPointerCapture(e.pointerId);
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
    >
      {label}
    </button>
  );
}
