export type BuildingKind = "home" | "school" | "office";

export type BuildingId =
  | "home"
  | "tk"
  | "sd"
  | "smp"
  | "sma"
  | "kuliah"
  | "office1"
  | "office2"
  | "office3";

export interface ModalContent {
  title: string;
  subtitle?: string;
  paragraphs: string[];
  bullets?: string[];
  tags?: string[];
}

export interface BuildingVisual {
  style: "home" | "school" | "campus" | "office";
  /** Front face width */
  width: number;
  /** Front wall height (without roof) */
  wallHeight: number;
  /** How far the building recedes (drawn as an oblique side face) */
  depth: number;
  /** Gable height; 0 = flat roof */
  roofHeight: number;
  floors: number;
  wallColor: string;
  roofColor: string;
  trimColor: string;
  windowColor: string;
  doorColor: string;
}

export interface BuildingData {
  id: BuildingId;
  kind: BuildingKind;
  name: string;
  shortLabel: string;
  /** Center of the front wall, at ground level */
  x: number;
  y: number;
  visual: BuildingVisual;
  modal: ModalContent;
  hasFloatingIcon?: boolean;
}

export type HairStyle = "short" | "spiky" | "long" | "bob" | "ponytail";

export interface CharacterLook {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes: string;
}

export interface NpcData {
  id: string;
  buildingId: BuildingId;
  name: string;
  gender: "male" | "female";
  x: number;
  y: number;
  look: CharacterLook;
  dialogue?: string[];
}

export interface DecorItem {
  id: string;
  kind: "tree" | "pine" | "bush" | "rock" | "flowers" | "lamp";
  x: number;
  y: number;
}

export const WORLD_WIDTH = 1340;
export const WORLD_HEIGHT = 920;
export const PLAYER_SPEED = 150;
export const CAMERA_LERP = 0.12;
export const INTERACT_DISTANCE = 80;
export const NPC_GREET_DISTANCE = 90;

/** Oblique projection used for building side faces & roofs */
export const OBLIQUE = { x: 0.55, y: 0.42 };

export const PLAYER_START = { x: 212, y: 400 };

export const PLAYER_LOOK: CharacterLook = {
  skin: "#f6cfa8",
  hair: "#3b2618",
  hairStyle: "short",
  shirt: "#2f8f6b",
  pants: "#2c3e63",
  shoes: "#4a2f22",
};

export const JUMP_TARGETS: { id: string; label: string; x: number; y: number }[] = [
  { id: "home", label: "Rumah", x: 212, y: 400 },
  { id: "schools", label: "Sekolah", x: 500, y: 322 },
  { id: "campus", label: "Kuliah", x: 990, y: 532 },
  { id: "offices", label: "Kantor", x: 1140, y: 650 },
];

/** Road with sharp corners, following the hand-drawn sketch */
export const road: { x: number; y: number }[] = [
  { x: 205, y: 395 },
  { x: 300, y: 240 },
  { x: 620, y: 378 },
  { x: 540, y: 474 },
  { x: 640, y: 532 },
  { x: 1140, y: 532 },
  { x: 1140, y: 752 },
  { x: 880, y: 752 },
];
export const ROAD_WIDTH = 40;

export const pond = { x: 760, y: 532, rx: 92, ry: 76 };

/** Bridge spans the whole pond so both ends land on grass/road */
export const bridge = { x: 760, y: 532, width: 232, deckHeight: 58, walkHalfHeight: 18 };

export const buildings: BuildingData[] = [
  {
    id: "home",
    kind: "home",
    name: "Rumah",
    shortLabel: "Rumah",
    x: 100,
    y: 382,
    hasFloatingIcon: true,
    visual: {
      style: "home",
      width: 92,
      wallHeight: 54,
      depth: 56,
      roofHeight: 38,
      floors: 1,
      wallColor: "#f3e2c4",
      roofColor: "#c2553a",
      trimColor: "#7a4a2a",
      windowColor: "#a8dcf0",
      doorColor: "#6b3f24",
    },
    modal: {
      title: "About Me",
      subtitle: "Halo! Selamat datang di kotaku 🌿",
      paragraphs: [
        "Aku Azzam — developer yang suka membangun pengalaman interaktif.",
        "Jelajahi jalan kota: dekati bangunan lalu tekan E, atau klik bangunannya untuk membuka cerita.",
      ],
      bullets: [
        "Fokus: Frontend, product craft, UX",
        "Suka visual storytelling & game feel",
        "Open untuk kolaborasi menarik",
      ],
      tags: ["Next.js", "TypeScript", "UI/UX"],
    },
  },
  {
    id: "tk",
    kind: "school",
    name: "Taman Kanak-Kanak",
    shortLabel: "TK",
    x: 330,
    y: 180,
    visual: {
      style: "school",
      width: 96,
      wallHeight: 50,
      depth: 54,
      roofHeight: 30,
      floors: 1,
      wallColor: "#ffe9a8",
      roofColor: "#ef7d4f",
      trimColor: "#d97706",
      windowColor: "#9fd0ff",
      doorColor: "#b45309",
    },
    modal: {
      title: "TK — Awal Petualangan",
      subtitle: "Fondasi rasa ingin tahu",
      paragraphs: ["Belajar berbagi, menggambar, dan mengenal dunia lewat bermain."],
      bullets: ["Sosial & kolaborasi dasar", "Eksplorasi kreatif"],
      tags: ["Curiosity", "Play"],
    },
  },
  {
    id: "sd",
    kind: "school",
    name: "Sekolah Dasar",
    shortLabel: "SD",
    x: 480,
    y: 250,
    visual: {
      style: "school",
      width: 110,
      wallHeight: 58,
      depth: 60,
      roofHeight: 32,
      floors: 1,
      wallColor: "#f4f1ea",
      roofColor: "#c0392b",
      trimColor: "#b91c1c",
      windowColor: "#bfe3f5",
      doorColor: "#7f1d1d",
    },
    modal: {
      title: "SD — Dasar Pengetahuan",
      subtitle: "Membangun kebiasaan belajar",
      paragraphs: ["Fondasi literasi, numerasi, dan rasa percaya diri untuk terus bertanya."],
      bullets: ["Kegiatan kelas & lomba", "Tertarik komputer & kreativitas digital"],
      tags: ["Foundation"],
    },
  },
  {
    id: "smp",
    kind: "school",
    name: "Sekolah Menengah Pertama",
    shortLabel: "SMP",
    x: 690,
    y: 330,
    visual: {
      style: "school",
      width: 110,
      wallHeight: 60,
      depth: 60,
      roofHeight: 30,
      floors: 1,
      wallColor: "#eef3f8",
      roofColor: "#2563eb",
      trimColor: "#1e3a8a",
      windowColor: "#cfeefe",
      doorColor: "#1e3a8a",
    },
    modal: {
      title: "SMP — Eksplorasi Minat",
      subtitle: "Ketertarikan yang menguat",
      paragraphs: ["Minat teknologi & desain mulai jelas. Proyek kecil jadi cara belajar favorit."],
      bullets: ["Website sederhana", "Kerja tim di organisasi"],
      tags: ["Exploration"],
    },
  },
  {
    id: "sma",
    kind: "school",
    name: "Sekolah Menengah Atas",
    shortLabel: "SMA",
    x: 380,
    y: 600,
    visual: {
      style: "school",
      width: 120,
      wallHeight: 80,
      depth: 62,
      roofHeight: 30,
      floors: 2,
      wallColor: "#ece6dc",
      roofColor: "#6b7280",
      trimColor: "#374151",
      windowColor: "#cde7f7",
      doorColor: "#374151",
    },
    modal: {
      title: "SMA — Arah yang Lebih Jelas",
      subtitle: "Persiapan dunia lebih luas",
      paragraphs: ["Mengasah disiplin, presentasi ide, dan keputusan menekuni teknologi."],
      bullets: ["Proyek digital", "Persiapan kuliah IT"],
      tags: ["Focus", "Growth"],
    },
  },
  {
    id: "kuliah",
    kind: "school",
    name: "Perguruan Tinggi",
    shortLabel: "Kuliah",
    x: 990,
    y: 470,
    visual: {
      style: "campus",
      width: 140,
      wallHeight: 92,
      depth: 70,
      roofHeight: 0,
      floors: 3,
      wallColor: "#e9e2d0",
      roofColor: "#8a8170",
      trimColor: "#7c6f57",
      windowColor: "#bcdff2",
      doorColor: "#3f3527",
    },
    modal: {
      title: "Kuliah — Craft & Engineering",
      subtitle: "Belajar membangun sistem",
      paragraphs: [
        "Memperdalam software engineering, desain interaksi, dan menyampaikan ide dengan jelas.",
      ],
      bullets: ["Capstone web", "Komunitas teknologi", "Magang awal"],
      tags: ["CS", "Engineering"],
    },
  },
  {
    id: "office1",
    kind: "office",
    name: "Kantor Pertama",
    shortLabel: "Office 1",
    x: 1235,
    y: 690,
    visual: {
      style: "office",
      width: 96,
      wallHeight: 150,
      depth: 56,
      roofHeight: 0,
      floors: 6,
      wallColor: "#c9d3dd",
      roofColor: "#9aa6b2",
      trimColor: "#475569",
      windowColor: "#5fb6e8",
      doorColor: "#1e293b",
    },
    modal: {
      title: "Pengalaman Kerja — Company A",
      subtitle: "Junior Frontend Developer",
      paragraphs: ["Membangun UI rapi, merapikan design system, kolaborasi desain & backend."],
      bullets: ["Komponen reusable", "Performa & a11y", "Dashboard & landing"],
      tags: ["React", "Design System"],
    },
  },
  {
    id: "office2",
    kind: "office",
    name: "Kantor Kedua",
    shortLabel: "Office 2",
    x: 1010,
    y: 696,
    visual: {
      style: "office",
      width: 104,
      wallHeight: 96,
      depth: 58,
      roofHeight: 0,
      floors: 4,
      wallColor: "#e7dccb",
      roofColor: "#a8977d",
      trimColor: "#7c5f3c",
      windowColor: "#7cc6e6",
      doorColor: "#3b2a1a",
    },
    modal: {
      title: "Pengalaman Kerja — Company B",
      subtitle: "Frontend / Full-stack Engineer",
      paragraphs: ["Ownership fitur end-to-end, mentoring ringan, kualitas rilis."],
      bullets: ["Fitur product harian", "API & testing", "Tools kolaborasi"],
      tags: ["TypeScript", "Next.js"],
    },
  },
  {
    id: "office3",
    kind: "office",
    name: "Kantor Ketiga",
    shortLabel: "Office 3",
    x: 790,
    y: 800,
    visual: {
      style: "office",
      width: 110,
      wallHeight: 120,
      depth: 60,
      roofHeight: 0,
      floors: 5,
      wallColor: "#3f4a59",
      roofColor: "#2f3845",
      trimColor: "#1f2937",
      windowColor: "#8fd3c4",
      doorColor: "#111827",
    },
    modal: {
      title: "Pengalaman Kerja — Company C",
      subtitle: "Product-minded Engineer",
      paragraphs: ["Fokus impact: memahami user, merancang solusi, mengeksekusi dengan craft baik."],
      bullets: ["Fitur strategis", "Kolaborasi lintas fungsi", "Creative interfaces"],
      tags: ["Product", "UX Engineering"],
    },
  },
];

const npcLooks: Record<string, [CharacterLook, CharacterLook]> = {
  tk: [
    { skin: "#f6cfa8", hair: "#2b1d14", hairStyle: "spiky", shirt: "#f59e0b", pants: "#1e3a5f", shoes: "#3b2a1a" },
    { skin: "#f2c39b", hair: "#5a3420", hairStyle: "ponytail", shirt: "#f472b6", pants: "#7c2d52", shoes: "#3b2a1a" },
  ],
  sd: [
    { skin: "#e8b48a", hair: "#1f1a17", hairStyle: "short", shirt: "#f8fafc", pants: "#b91c1c", shoes: "#1f1a17" },
    { skin: "#f6cfa8", hair: "#3b2618", hairStyle: "bob", shirt: "#f8fafc", pants: "#b91c1c", shoes: "#1f1a17" },
  ],
  smp: [
    { skin: "#f2c39b", hair: "#2b1d14", hairStyle: "short", shirt: "#f8fafc", pants: "#1e3a8a", shoes: "#1f1a17" },
    { skin: "#e8b48a", hair: "#4a2c1a", hairStyle: "long", shirt: "#f8fafc", pants: "#1e3a8a", shoes: "#1f1a17" },
  ],
  sma: [
    { skin: "#f6cfa8", hair: "#1f1a17", hairStyle: "spiky", shirt: "#f8fafc", pants: "#6b7280", shoes: "#1f1a17" },
    { skin: "#f2c39b", hair: "#6b3f24", hairStyle: "ponytail", shirt: "#f8fafc", pants: "#6b7280", shoes: "#1f1a17" },
  ],
  kuliah: [
    { skin: "#e8b48a", hair: "#2b1d14", hairStyle: "short", shirt: "#0f766e", pants: "#374151", shoes: "#3b2a1a" },
    { skin: "#f6cfa8", hair: "#3b2618", hairStyle: "long", shirt: "#a855f7", pants: "#1f2937", shoes: "#3b2a1a" },
  ],
  office1: [
    { skin: "#f2c39b", hair: "#1f1a17", hairStyle: "short", shirt: "#334155", pants: "#1f2937", shoes: "#111827" },
    { skin: "#e8b48a", hair: "#4a2c1a", hairStyle: "bob", shirt: "#be123c", pants: "#1f2937", shoes: "#111827" },
  ],
  office2: [
    { skin: "#f6cfa8", hair: "#5a3420", hairStyle: "spiky", shirt: "#0369a1", pants: "#334155", shoes: "#111827" },
    { skin: "#f2c39b", hair: "#2b1d14", hairStyle: "long", shirt: "#f59e0b", pants: "#3f3f46", shoes: "#111827" },
  ],
  office3: [
    { skin: "#e8b48a", hair: "#2b1d14", hairStyle: "short", shirt: "#166534", pants: "#1f2937", shoes: "#111827" },
    { skin: "#f6cfa8", hair: "#6b3f24", hairStyle: "ponytail", shirt: "#7c3aed", pants: "#1f2937", shoes: "#111827" },
  ],
};

const npcNames: Record<string, [string, string]> = {
  tk: ["Budi", "Sari"],
  sd: ["Andi", "Maya"],
  smp: ["Rafi", "Nina"],
  sma: ["Dimas", "Luna"],
  kuliah: ["Arya", "Putri"],
  office1: ["Ken", "Alya"],
  office2: ["Rio", "Elena"],
  office3: ["Farhan", "Mira"],
};

export const npcs: NpcData[] = buildings
  .filter((b) => b.kind !== "home")
  .flatMap((b) => {
    const [mName, fName] = npcNames[b.id];
    const [mLook, fLook] = npcLooks[b.id];
    return [
      {
        id: `${b.id}-m`,
        buildingId: b.id,
        name: mName,
        gender: "male" as const,
        x: b.x - 40,
        y: b.y + 20,
        look: mLook,
        dialogue: ["Halo Azzam!"],
      },
      {
        id: `${b.id}-f`,
        buildingId: b.id,
        name: fName,
        gender: "female" as const,
        x: b.x + 40,
        y: b.y + 20,
        look: fLook,
        dialogue: ["Halo Azzam!"],
      },
    ];
  });

export const decor: DecorItem[] = [
  { id: "t1", kind: "tree", x: 40, y: 250 },
  { id: "t2", kind: "pine", x: 40, y: 520 },
  { id: "t3", kind: "tree", x: 190, y: 110 },
  { id: "t4", kind: "pine", x: 610, y: 100 },
  { id: "t5", kind: "tree", x: 860, y: 180 },
  { id: "t6", kind: "tree", x: 1080, y: 200 },
  { id: "t7", kind: "pine", x: 1300, y: 440 },
  { id: "t8", kind: "tree", x: 560, y: 700 },
  { id: "t9", kind: "tree", x: 200, y: 620 },
  { id: "t10", kind: "pine", x: 120, y: 800 },
  { id: "t11", kind: "tree", x: 400, y: 840 },
  { id: "t12", kind: "pine", x: 640, y: 880 },
  { id: "t13", kind: "tree", x: 1000, y: 870 },
  { id: "t14", kind: "pine", x: 1250, y: 860 },
  { id: "t15", kind: "tree", x: 1290, y: 200 },
  { id: "b1", kind: "bush", x: 250, y: 470 },
  { id: "b2", kind: "bush", x: 500, y: 420 },
  { id: "b3", kind: "bush", x: 875, y: 440 },
  { id: "b4", kind: "bush", x: 930, y: 640 },
  { id: "b5", kind: "bush", x: 330, y: 700 },
  { id: "f1", kind: "flowers", x: 160, y: 440 },
  { id: "f2", kind: "flowers", x: 280, y: 520 },
  { id: "f3", kind: "flowers", x: 860, y: 620 },
  { id: "f4", kind: "flowers", x: 1180, y: 470 },
  { id: "f5", kind: "flowers", x: 560, y: 600 },
  { id: "f6", kind: "flowers", x: 1060, y: 820 },
  { id: "f7", kind: "flowers", x: 240, y: 170 },
  { id: "r1", kind: "rock", x: 300, y: 640 },
  { id: "r2", kind: "rock", x: 1080, y: 880 },
  { id: "r3", kind: "rock", x: 560, y: 800 },
  { id: "l1", kind: "lamp", x: 230, y: 300 },
  { id: "l2", kind: "lamp", x: 400, y: 250 },
  { id: "l3", kind: "lamp", x: 612, y: 575 },
  { id: "l4", kind: "lamp", x: 940, y: 575 },
  { id: "l5", kind: "lamp", x: 1176, y: 630 },
  { id: "l6", kind: "lamp", x: 1000, y: 792 },
];

/** Screen-space-independent bounds of a building sprite (for clicks / culling) */
export function getBuildingBounds(b: BuildingData) {
  const v = b.visual;
  const dx = v.depth * OBLIQUE.x;
  const dy = v.depth * OBLIQUE.y;
  return {
    left: b.x - v.width / 2 - 8,
    right: b.x + v.width / 2 + dx + 8,
    top: b.y - v.wallHeight - v.roofHeight - dy - 16,
    bottom: b.y + 12,
  };
}

/** Ground footprint the player cannot walk into */
function insideBuildingFootprint(x: number, y: number): boolean {
  for (const b of buildings) {
    const v = b.visual;
    const dx = v.depth * OBLIQUE.x;
    const dy = v.depth * OBLIQUE.y;
    const left = b.x - v.width / 2 - 6;
    const right = b.x + v.width / 2 + dx * 0.7;
    const top = b.y - dy;
    const bottom = b.y + 4;
    if (x > left && x < right && y > top && y < bottom) return true;
  }
  return false;
}

function inWater(x: number, y: number): boolean {
  const nx = (x - pond.x) / (pond.rx + 4);
  const ny = (y - pond.y) / (pond.ry + 4);
  if (nx * nx + ny * ny >= 1) return false;
  const onBridge =
    Math.abs(x - bridge.x) <= bridge.width / 2 &&
    Math.abs(y - bridge.y) <= bridge.walkHalfHeight;
  return !onBridge;
}

export function isBlocked(x: number, y: number): boolean {
  if (x < 20 || y < 30 || x > WORLD_WIDTH - 20 || y > WORLD_HEIGHT - 10) return true;
  return insideBuildingFootprint(x, y) || inWater(x, y);
}

export function findNearestBuilding(
  playerX: number,
  playerY: number,
  maxDistance = INTERACT_DISTANCE,
): BuildingData | null {
  let best: BuildingData | null = null;
  let bestDist = maxDistance;
  for (const b of buildings) {
    const dist = Math.hypot(playerX - b.x, playerY - (b.y + 14));
    const limit = Math.max(maxDistance, b.visual.width * 0.75);
    if (dist < limit && dist < bestDist) {
      best = b;
      bestDist = dist;
    }
  }
  return best;
}
