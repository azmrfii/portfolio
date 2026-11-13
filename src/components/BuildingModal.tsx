"use client";

import type { BuildingData, BuildingKind } from "@/data/worldData";

const KIND_LABEL: Record<BuildingKind, string> = {
  home: "Start",
  school: "Education",
  office: "Experience",
  shop: "Break Time",
  hangout: "Friends",
};

interface BuildingModalProps {
  building: BuildingData | null;
  onClose: () => void;
}

export default function BuildingModal({ building, onClose }: BuildingModalProps) {
  if (!building) return null;
  const { modal, kind, shortLabel } = building;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="building-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1a2e1a]/55 backdrop-blur-[2px]"
        aria-label="Tutup modal"
        onClick={onClose}
      />

      <div className="pixel-panel relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-modal-in">
        <div className="flex items-start justify-between gap-3 border-b-4 border-[#5b3a29] pb-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b6914] mb-1">
              {KIND_LABEL[kind]} · {shortLabel}
            </p>
            <h2
              id="building-modal-title"
              className="font-pixel text-sm sm:text-base leading-relaxed text-[#3b2a1a]"
            >
              {modal.title}
            </h2>
            {building.signLines.length > 0 && kind !== "home" && (
              <p className="mt-1 text-xs font-bold text-[#5b3a29]">📍 {building.name}</p>
            )}
            {modal.subtitle && (
              <p className="mt-2 text-sm text-[#6b4f3a]">{modal.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn shrink-0 px-3 py-1 text-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-[#3b2a1a]">
          {modal.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        {modal.bullets && modal.bullets.length > 0 && (
          <ul className="mt-4 space-y-2 border-t-2 border-dashed border-[#c4a574] pt-4">
            {modal.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-[#3b2a1a]">
                <span className="text-[#5d8a4a]" aria-hidden>
                  ▸
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {modal.tags && modal.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {modal.tags.map((tag) => (
              <span
                key={tag}
                className="border-2 border-[#5b3a29] bg-[#e8f5d8] px-2 py-1 text-[10px] font-pixel text-[#3b2a1a]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-[10px] text-[#8b7355]">
          Tekan Esc / klik di luar untuk menutup
        </p>
      </div>
    </div>
  );
}
