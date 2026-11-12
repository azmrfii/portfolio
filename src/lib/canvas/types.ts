export type PlayerAnim = "idle" | "walk" | "wave";
export type Facing = "down" | "up" | "left" | "right";

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Facing;
  anim: PlayerAnim;
  animTime: number;
  waving: boolean;
  waveTimer: number;
}

export interface CameraState {
  x: number;
  y: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  interact: boolean;
  wave: boolean;
}

export interface WorldRenderContext {
  ctx: CanvasRenderingContext2D;
  cameraX: number;
  cameraY: number;
  viewW: number;
  viewH: number;
  time: number;
}

export type SortableKind = "decor" | "building" | "npc" | "player";

export interface SortableEntity {
  kind: SortableKind;
  /** Sort key = feet / base Y */
  sortY: number;
  id: string;
}
