"use client";

type Dir = "left" | "right" | "up" | "down";

interface VirtualControlsProps {
  onDir: (dir: Dir, pressed: boolean) => void;
  onWave: () => void;
  onInteract: () => void;
}

const ROTATION: Record<Dir, string> = {
  up: "rotate-0",
  right: "rotate-90",
  down: "rotate-180",
  left: "-rotate-90",
};

export default function VirtualControls({
  onDir,
  onWave,
  onInteract,
}: VirtualControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 sm:p-5 md:hidden">
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
        <span />
        <PadButton
          dir="up"
          ariaLabel="Atas"
          onPress={() => onDir("up", true)}
          onRelease={() => onDir("up", false)}
        />
        <span />
        <PadButton
          dir="left"
          ariaLabel="Kiri"
          onPress={() => onDir("left", true)}
          onRelease={() => onDir("left", false)}
        />
        <PadButton
          dir="down"
          ariaLabel="Bawah"
          onPress={() => onDir("down", true)}
          onRelease={() => onDir("down", false)}
        />
        <PadButton
          dir="right"
          ariaLabel="Kanan"
          onPress={() => onDir("right", true)}
          onRelease={() => onDir("right", false)}
        />
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
  dir,
  ariaLabel,
  onPress,
  onRelease,
}: {
  dir: Dir;
  ariaLabel: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="pixel-btn flex h-12 w-12 items-center justify-center select-none touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 fill-[#3b2a1a] ${ROTATION[dir]}`}
        aria-hidden="true"
      >
        <polygon points="12,4 21,19 3,19" />
      </svg>
    </button>
  );
}
