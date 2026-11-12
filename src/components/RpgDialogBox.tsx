"use client";

import { sound } from "@/lib/audio/chiptune";
import { useCallback, useEffect, useState } from "react";

export interface RpgDialogData {
  speaker: string;
  subtitle?: string;
  pages: string[];
  tags?: string[];
}

interface RpgDialogBoxProps {
  dialog: RpgDialogData | null;
  onClose: () => void;
}

export default function RpgDialogBox({ dialog, onClose }: RpgDialogBoxProps) {
  const [pageIdx, setPageIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const currentText = dialog ? (dialog.pages[pageIdx] ?? "") : "";
  const isTyping = charCount < currentText.length;
  const isLastPage = dialog ? pageIdx >= dialog.pages.length - 1 : true;

  useEffect(() => {
    if (!dialog) return;
    if (charCount >= currentText.length) return;
    const t = window.setTimeout(() => {
      setCharCount((c) => c + 2);
    }, 18);
    return () => window.clearTimeout(t);
  }, [charCount, currentText, dialog]);

  const advance = useCallback(() => {
    if (!dialog) return;
    sound.playBlip();
    if (isTyping) {
      setCharCount(currentText.length);
      return;
    }
    if (!isLastPage) {
      setPageIdx((p) => p + 1);
      setCharCount(0);
    } else {
      onClose();
    }
  }, [currentText.length, dialog, isLastPage, isTyping, onClose]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        advance();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [advance, dialog, onClose]);

  if (!dialog) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-5 sm:px-6">
      <div
        role="dialog"
        aria-label={dialog.speaker}
        onClick={advance}
        className="pixel-panel w-full max-w-2xl cursor-pointer select-none !p-4 shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#c4a574] pb-2">
          <div>
            <p className="font-pixel text-xs text-[#3b2a1a] sm:text-sm">{dialog.speaker}</p>
            {dialog.subtitle && (
              <p className="text-[11px] font-semibold text-[#8b6914]">{dialog.subtitle}</p>
            )}
          </div>
          <span className="rounded bg-[#e8f5d8] px-2 py-0.5 text-[10px] font-bold text-[#3b2a1a]">
            Hal {pageIdx + 1}/{dialog.pages.length}
          </span>
        </div>

        <p className="mt-3 min-h-[3.2rem] text-sm leading-relaxed text-[#3b2a1a] sm:text-base">
          {currentText.slice(0, charCount)}
          {isTyping && <span className="animate-pulse">▌</span>}
        </p>

        {dialog.tags && dialog.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {dialog.tags.map((t) => (
              <span
                key={t}
                className="border border-[#5b3a29] bg-[#fff8e7] px-2 py-0.5 font-pixel text-[9px] text-[#3b2a1a]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-[#6b4f3a]">
          <span>Tekan ESC untuk tutup</span>
          <span className="font-bold text-[#3b2a1a]">
            {isTyping
              ? "Tekan E / Klik untuk tampilkan semua ▸"
              : isLastPage
                ? "Tekan E / Klik untuk selesai ✓"
                : "Tekan E / Klik untuk lanjut ▼"}
          </span>
        </div>
      </div>
    </div>
  );
}
