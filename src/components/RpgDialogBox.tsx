"use client";

import { sound } from "@/lib/audio/chiptune";
import { useCallback, useEffect, useState } from "react";

export interface RpgDialogChoice {
  id: string;
  label: string;
}

export interface RpgDialogData {
  speaker: string;
  subtitle?: string;
  pages: string[];
  tags?: string[];
  image?: { src: string; alt: string };
  /** Shown once the last page has finished typing */
  choices?: RpgDialogChoice[];
  onChoice?: (id: string) => void;
  /** Called when the dialog is dismissed without picking a choice */
  onClose?: () => void;
}

interface RpgDialogBoxProps {
  dialog: RpgDialogData | null;
  onClose: () => void;
  onChoose: (id: string) => void;
}

export default function RpgDialogBox({ dialog, onClose, onChoose }: RpgDialogBoxProps) {
  const [pageIdx, setPageIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [selected, setSelected] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const currentText = dialog ? (dialog.pages[pageIdx] ?? "") : "";
  const isTyping = charCount < currentText.length;
  const isLastPage = dialog ? pageIdx >= dialog.pages.length - 1 : true;
  const choices = dialog?.choices ?? [];
  const showChoices = isLastPage && !isTyping && choices.length > 0;

  useEffect(() => {
    if (!dialog) return;
    if (charCount >= currentText.length) return;
    const t = window.setTimeout(() => {
      setCharCount((c) => c + 2);
    }, 18);
    return () => window.clearTimeout(t);
  }, [charCount, currentText, dialog]);

  const choose = useCallback(
    (idx: number) => {
      const c = choices[idx];
      if (!c) return;
      sound.playBlip();
      onChoose(c.id);
    },
    [choices, onChoose],
  );

  const advance = useCallback(() => {
    if (!dialog) return;
    if (showChoices) {
      choose(selected);
      return;
    }
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
  }, [choose, currentText.length, dialog, isLastPage, isTyping, onClose, selected, showChoices]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (showChoices && (k === "ArrowUp" || k === "ArrowDown" || k === "w" || k === "W" || k === "s" || k === "S")) {
        e.preventDefault();
        e.stopPropagation();
        const delta = k === "ArrowUp" || k === "w" || k === "W" ? -1 : 1;
        setSelected((s) => (s + delta + choices.length) % choices.length);
        sound.playStep();
        return;
      }
      if (k === "e" || k === "E" || k === " " || k === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) advance();
      } else if (k === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [advance, choices.length, dialog, onClose, showChoices]);

  if (!dialog) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-5 sm:px-6">
      <div
        role="dialog"
        aria-label={dialog.speaker}
        onClick={showChoices ? undefined : advance}
        className={`pixel-panel w-full max-w-2xl select-none !p-4 shadow-2xl ${showChoices ? "" : "cursor-pointer"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#c4a574] pb-2">
          <div>
            <p className="font-pixel text-xs text-[#3b2a1a] sm:text-sm">{dialog.speaker}</p>
            {dialog.subtitle && (
              <p className="text-[11px] font-semibold text-[#8b6914]">{dialog.subtitle}</p>
            )}
          </div>
          {dialog.pages.length > 1 && (
            <span className="rounded bg-[#e8f5d8] px-2 py-0.5 text-[10px] font-bold text-[#3b2a1a]">
              Hal {pageIdx + 1}/{dialog.pages.length}
            </span>
          )}
        </div>

        {dialog.image && (
          <div className="mt-3 flex justify-center">
            {imageFailed ? (
              <div className="flex h-36 w-full max-w-sm items-center justify-center border-4 border-[#b7791f] bg-[#fef3c7] px-4 text-center text-xs text-[#6b4f3a]">
                Foto belum ada — taruh file PNG di <code className="mx-1 font-bold">public{dialog.image.src}</code>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied file of unknown size; must fall back when missing
              <img
                src={dialog.image.src}
                alt={dialog.image.alt}
                onError={() => setImageFailed(true)}
                className="max-h-56 w-auto max-w-full border-4 border-[#b7791f] bg-[#fef3c7] object-contain shadow-md"
              />
            )}
          </div>
        )}

        <p className="mt-3 min-h-[3.2rem] whitespace-pre-line text-sm leading-relaxed text-[#3b2a1a] sm:text-base">
          {currentText.slice(0, charCount)}
          {isTyping && <span className="animate-pulse">▌</span>}
        </p>

        {showChoices && (
          <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
            {choices.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setSelected(i)}
                onClick={(e) => {
                  e.stopPropagation();
                  choose(i);
                }}
                className={`pixel-btn flex-1 px-3 py-2 text-left text-[10px] sm:text-center ${
                  i === selected ? "!bg-[#fde68a]" : "!bg-[#fff8e7]"
                }`}
              >
                {i === selected ? "▶ " : ""}
                {c.label}
              </button>
            ))}
          </div>
        )}

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
            {showChoices
              ? "↑/↓ pilih · E untuk konfirmasi"
              : isTyping
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
