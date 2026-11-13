import { BAR_STATIONS, DRINKS, type DrinkId } from "@/data/aglData";
import type { Facing } from "./types";

export type BaristaAct = "glass" | "ice" | "pour" | "blend" | "pourBlend" | "garnish" | "serve";

type Segment =
  | { kind: "walk"; to: number }
  | { kind: "act"; act: BaristaAct; dur: number; label: string };

export interface BaristaOrder {
  drink: DrinkId;
  elapsed: number;
  serveX: number;
}

export interface BaristaFrame {
  x: number;
  facing: Facing;
  walking: boolean;
  /** Current action (null while walking) */
  act: BaristaAct | null;
  /** 0..1 within the current action */
  actProgress: number;
  label: string;
  stepIndex: number;
  stepCount: number;
  overall: number;
  /** Glass contents */
  hasGlass: boolean;
  ice: number;
  fill: number;
  garnished: boolean;
  done: boolean;
}

const WALK_SPEED = 0.11; // px per ms

function buildScript(drink: DrinkId, serveX: number): Segment[] {
  const d = DRINKS[drink];
  const steps: Segment[] = [
    { kind: "walk", to: BAR_STATIONS.glass },
    { kind: "act", act: "glass", dur: 650, label: "Ambil gelas bersih..." },
    { kind: "walk", to: BAR_STATIONS.ice },
    { kind: "act", act: "ice", dur: 900, label: "Isi es batu..." },
  ];
  if (drink === "popice") {
    steps.push(
      { kind: "walk", to: BAR_STATIONS.blender },
      { kind: "act", act: "blend", dur: 1900, label: d.pourText },
      { kind: "act", act: "pourBlend", dur: 800, label: "Tuang ke gelas..." },
    );
  } else {
    steps.push(
      { kind: "walk", to: BAR_STATIONS.soda },
      { kind: "act", act: "pour", dur: 1500, label: d.pourText },
    );
  }
  steps.push(
    { kind: "walk", to: BAR_STATIONS.center },
    { kind: "act", act: "garnish", dur: 1000, label: `${d.garnishText}...` },
    { kind: "walk", to: serveX },
    { kind: "act", act: "serve", dur: 700, label: "Silakan, Zam!" },
  );
  return steps;
}

function segmentDuration(seg: Segment, fromX: number): number {
  return seg.kind === "walk" ? Math.abs(seg.to - fromX) / WALK_SPEED : seg.dur;
}

export function baristaDuration(order: BaristaOrder): number {
  let x = BAR_STATIONS.center;
  let total = 0;
  for (const seg of buildScript(order.drink, order.serveX)) {
    total += segmentDuration(seg, x);
    if (seg.kind === "walk") x = seg.to;
  }
  return total;
}

export function baristaFrame(order: BaristaOrder): BaristaFrame {
  const script = buildScript(order.drink, order.serveX);
  const actCount = script.filter((s) => s.kind === "act").length;
  const total = baristaDuration(order);

  let x = BAR_STATIONS.center;
  let t = order.elapsed;
  let actIndex = 0;
  const frame: BaristaFrame = {
    x,
    facing: "down",
    walking: false,
    act: null,
    actProgress: 0,
    label: "",
    stepIndex: 0,
    stepCount: actCount,
    overall: Math.min(1, order.elapsed / total),
    hasGlass: false,
    ice: 0,
    fill: 0,
    garnished: false,
    done: order.elapsed >= total,
  };

  for (const seg of script) {
    const dur = segmentDuration(seg, x);
    const within = t < dur;
    const p = within ? t / Math.max(1, dur) : 1;

    if (seg.kind === "walk") {
      const nx = x + (seg.to - x) * p;
      if (within) {
        frame.x = nx;
        frame.walking = dur > 1;
        frame.facing = seg.to < x ? "left" : "right";
        frame.label = nextActLabel(script, seg);
        frame.stepIndex = actIndex;
        return frame;
      }
      x = seg.to;
      t -= dur;
      continue;
    }

    applyAct(frame, seg.act, p);
    if (within) {
      frame.x = x;
      frame.act = seg.act;
      frame.actProgress = p;
      frame.label = seg.label;
      frame.stepIndex = actIndex;
      frame.facing = seg.act === "garnish" || seg.act === "serve" ? "down" : "up";
      return frame;
    }
    t -= dur;
    actIndex++;
  }

  frame.x = x;
  frame.label = "Silakan, Zam!";
  frame.stepIndex = actCount;
  return frame;
}

function nextActLabel(script: Segment[], walk: Segment): string {
  const i = script.indexOf(walk);
  const next = script.slice(i + 1).find((s) => s.kind === "act");
  return next && next.kind === "act" ? next.label : "";
}

function applyAct(frame: BaristaFrame, act: BaristaAct, p: number): void {
  switch (act) {
    case "glass":
      frame.hasGlass = p > 0.5;
      break;
    case "ice":
      frame.ice = p;
      break;
    case "pour":
      frame.fill = Math.max(frame.fill, p * 0.9);
      break;
    case "pourBlend":
      frame.fill = Math.max(frame.fill, p * 0.9);
      break;
    case "garnish":
      frame.garnished = p > 0.6;
      break;
  }
}
