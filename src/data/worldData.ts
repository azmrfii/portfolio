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
  /** Institution / company name lines shown on the sign under the short label */
  signLines: string[];
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

export const WORLD_WIDTH = 1160;
export const WORLD_HEIGHT = 770;
export const PLAYER_SPEED = 150;
export const CAMERA_LERP = 0.12;
export const INTERACT_DISTANCE = 80;
export const NPC_GREET_DISTANCE = 90;

/** Oblique projection used for building side faces & roofs */
export const OBLIQUE = { x: 0.55, y: 0.42 };

export const PLAYER_START = { x: 150, y: 340 };

export const PLAYER_LOOK: CharacterLook = {
  skin: "#f6cfa8",
  hair: "#3b2618",
  hairStyle: "short",
  shirt: "#2f8f6b",
  pants: "#2c3e63",
  shoes: "#4a2f22",
};

export const JUMP_TARGETS: { id: string; label: string; x: number; y: number }[] = [
  { id: "home", label: "Rumah", x: 150, y: 340 },
  { id: "schools", label: "Sekolah", x: 520, y: 340 },
  { id: "campus", label: "Kuliah", x: 930, y: 650 },
  { id: "offices", label: "Kantor", x: 380, y: 650 },
];

/** Row 1 (schools) runs left→right, then the road turns down and row 2 (campus → offices) runs back right→left */
export const ROW1_Y = 340;
export const ROW2_Y = 650;
/** Gap between a building's ground line and the center of the road in front of it */
const ROAD_GAP = 90;
const ROW1_BASE = ROW1_Y - ROAD_GAP;
const ROW2_BASE = ROW2_Y - ROAD_GAP;

/** Simple U-shaped road: two straight streets joined by one connector */
export const road: { x: number; y: number }[] = [
  { x: 110, y: ROW1_Y },
  { x: 1080, y: ROW1_Y },
  { x: 1080, y: ROW2_Y },
  { x: 110, y: ROW2_Y },
];
export const ROAD_WIDTH = 40;

/** Pond sits on row 2, between campus and the first office */
export const pond = { x: 745, y: ROW2_Y, rx: 72, ry: 56 };

/** Bridge spans the whole pond so both ends land on grass/road */
export const bridge = { x: 745, y: ROW2_Y, width: 184, deckHeight: 58, walkHalfHeight: 18 };

export const buildings: BuildingData[] = [
  {
    id: "home",
    kind: "home",
    name: "Rumah",
    shortLabel: "Rumah",
    signLines: [],
    x: 140,
    y: ROW1_BASE,
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
    name: "TK Ar Rofa",
    shortLabel: "TK",
    signLines: ["Ar Rofa"],
    x: 330,
    y: ROW1_BASE,
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
      title: "TK — Langsung TK B",
      subtitle: "Ga begitu inget banyak pas TK",
      paragraphs: ["Fyi dulu pas TK sempet 3x pindah karena ku ga tau mau ngapain, sehari sekolah langsung nanya kapan libur? xixi"],
      bullets: ["Bocil sewajarnya"],
      tags: ["Kebanyakan main"],
    },
  },
  {
    id: "sd",
    kind: "school",
    name: "MI Fathan Mubina",
    shortLabel: "SD",
    signLines: ["Fathan Mubina"],
    x: 520,
    y: ROW1_BASE,
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
      paragraphs: ["Sebenernya pindah ke sini pas kelas 2, karena bokap kerja di daerah bogor, bocil SD yang pendek akhirnya mendapatkan banyak teman walau tidak bisa mendapatkan ranking pertama sebagai laki-laki di SD ini (ranking 2 terus hufttt)."],
      bullets: ["OSN MTK (Harapan dua tingkat kecamatan, kabupaten? ya gagal lah wong belajar sendiri dibuku ga diajari wkwk)", "MTK dan Mendapatkan Uang adalah hal yang menyenangkan"],
      tags: ["Pondasi ilmu"],
    },
  },
  {
    id: "smp",
    kind: "school",
    name: "SMPIT Roudlotul Jannah",
    shortLabel: "SMP",
    signLines: ["Roudlotul Jannah"],
    x: 710,
    y: ROW1_BASE,
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
      subtitle: "Mulai tertarik akan beberapa hal",
      paragraphs: ["Punya banyak teman tercinta, cerita yang seru, sahabat yang baik disini, guru-guru yang selalu support walau udah jadi alumni, I miss you all my friends (second class), jangan berisik pas jamkos yeahh, sempet punya crush.."],
      bullets: ["Wakil Ketua Osis 2017-2018", "Ketua Osis 2018-2019", "Lomba MTK walau ga menang", "Ikut pelajaran MTK di kelas 9 padahal masih kelas 8"],
      tags: ["Mencoba banyak hal"],
    },
  },
  {
    id: "sma",
    kind: "school",
    name: "SMK Wikrama Garut (Tahun ke-1) · Farmako Medika Plus (Tahun ke-2 & 3)",
    shortLabel: "SMK",
    signLines: ["Wikrama Garut (Thn 1)", "Farmako Medika Plus (Thn 2-3)"],
    x: 900,
    y: ROW1_BASE,
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
      title: "SMK — Ini Arahnya kemana?",
      subtitle: "Ko dewasa secepat ini?",
      paragraphs: ["Boarding cuman setaun (tapi punya temen yang seru disana), terus pindah deh ke SMK yang gatau ini sekolah apaan, eh ternyata temen-nya pada seru, sefrekuensi, baik-baik, gurunya juga seruu, eh tiba-tiba ketemu crush juga karena sempet ngeliat dia salim ke bokapnya saat di anterin sekolah (jadi inget pas kecil sering gitu), and then i'm falling in love with her.."],
      bullets: ["Lomba MTK Peraih medali Emas (Nasional - Daring) - WK Garut", "Lomba MTK Peraih medali Perak (Nasional - Daring) - WK Garut", "Lomba MTK Peraih medali Perunggu (Nasional - Daring) - WK Garut", "Persiapan kuliah IT", "Pendiri eskul Basket - FMK", "Juara kelas dari semester 4 s.d Lulus - FMK"],
      tags: ["Pertemanan", "Fokus"],
    },
  },
  {
    id: "kuliah",
    kind: "school",
    name: "Universitas Telkom",
    shortLabel: "Kuliah",
    signLines: ["Universitas Telkom"],
    x: 940,
    y: ROW2_BASE,
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
      title: "Kuliah — PJJ Informatika",
      subtitle: "Oh telkom ada yang program PJJ ya?",
      paragraphs: [
        "Ngambil ilmu sekalian gelar karena kerja butuh gelar sarjana, temen ada cuman sebatas online itupun untuk tugas aja karena masing-masing punya kerjaan dan kehidupannya pribadi",
      ],
      bullets: ["Kuliah Online", "RAM beberapa matkul karena sudah kerja", "Aku mencintaimu LMS saat menjelang UAS"],
      tags: ["Engineering", "Informatika"],
    },
  },
  {
    id: "office1",
    kind: "office",
    name: "CV Sinang Permata Group",
    shortLabel: "Office 1",
    signLines: ["CV Sinang Permata Group"],
    x: 560,
    y: ROW2_BASE,
    visual: {
      style: "office",
      width: 96,
      wallHeight: 132,
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
      title: "Pengalaman Kerja — Internship",
      subtitle: "Web Developer — Juli 2022 s.d Sept. 2022",
      paragraphs: ["Fokus di slicing figma ke website, full remote pas masih SMK."],
      bullets: ["CMS Development: Built and managed a custom CMS for company profiles to streamline content management efficiency", "UI/UX Implementation: Translated Figma designs into responsive and interactive frontend code following industry standards", "Performance Optimization: Enhanced website functionality and speed by implementing clean code and web best practices"],
      tags: ["Laravel", "Github", "PHP", "MySQL", "JavaScript", "Trello", "CSS"],
    },
  },
  {
    id: "office2",
    kind: "office",
    name: "PT. Geomatika Satelit Indonesia",
    shortLabel: "Office 2",
    signLines: ["PT. Geomatika Satelit", "Indonesia"],
    x: 375,
    y: ROW2_BASE,
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
      title: "Pengalaman Kerja — Full-Time",
      subtitle: "IT Programmer — Okt. 2023 s.d Sept. 2025",
      paragraphs: ["Kantor pertama yang nerima saat ku baru lulus SMK, ketemu rekan kerja, sahabat, crush, atasan yang seru pol dan baik."],
      bullets: ["End-to-End Development: Engineered and maintained full-cycle web systems (Laravel) and mobile applications (Flutter), covering development, testing, and deployment", "Performance Optimization: Optimized RESTful APIs, successfully reducing data load times by over 60% (from 25s to under 10s) to enhance system stability", "System Integration: Collaborated with hardware teams to ensure seamless AIS data integration and secure delivery of maritime tracking data to the Ministry (KKP)", "Release Management: Managed the end-to-end mobile release lifecycle on Play Store and served as a technical liaison between management and engineering teams"],
      tags: ["Laravel", "Flutter", "Golang", "Python", "REST APIs", "MySQL", "jQuery", "JavaScript", "Google Play Console", "cPanel", "Canva", "Trello", "GitHub", "Node.js"],
    },
  },
  {
    id: "office3",
    kind: "office",
    name: "PT. Adidata Informatika",
    shortLabel: "Office 3",
    signLines: ["PT. Adidata Informatika", "★ Saat ini"],
    x: 190,
    y: ROW2_BASE,
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
      title: "Pengalaman Kerja — Contract",
      subtitle: "Fullstack Developer — Sept. 2025 s.d Saat ini",
      paragraphs: ["Masuk ke dunia IT consultant, yang mana beda project bisa beda bahasa pemograman.. ketemu rekan kerjaa yang seru poll dan baik walau beberapa udah beda perusahaan."],
      bullets: ["Fullstack Web Development: Developing enterprise web applications for PT SMI, including IOSS, ECMS (Laravel REST API & Livewire), and SMI Berbagi (React TypeScript & Laravel), focusing on automated workflows, business logic, and responsive UI", "Performance & Scaling: Optimizing system performance using Redis for caching and Apache Kafka for robust event-driven messaging across microservices", "Infrastructure & DevOps: Managing containerized environments with Docker and utilizing advanced Queue management to ensure high-speed data synchronization", "Agile Collaboration: Maintaining technical stability, shipping bug fixes, and driving disciplined SDLC execution across client deliverables using Git and Jira"],
      tags: ["AWS", "Jira", "Microsoft Azure", "Docker", "Agile", "Cursor AI", "Claude", "Vibe Coder", "Laravel", "Livewire", "React TS", "Redis", "Gitlab", "Microservices", "REST APIs", "SQL Server", "MySQL", "Apache Kafka"],
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
    // Stand beside the front corners so the name sign stays readable
    const offset = b.visual.width / 2 + 14;
    return [
      {
        id: `${b.id}-m`,
        buildingId: b.id,
        name: mName,
        gender: "male" as const,
        x: b.x - offset,
        y: b.y + 20,
        look: mLook,
        dialogue: ["Halo Azzam!"],
      },
      {
        id: `${b.id}-f`,
        buildingId: b.id,
        name: fName,
        gender: "female" as const,
        x: b.x + offset,
        y: b.y + 20,
        look: fLook,
        dialogue: ["Halo Azzam!"],
      },
    ];
  });

export const decor: DecorItem[] = [
  // Top strip, tucked between building backs
  { id: "t1", kind: "tree", x: 236, y: 120 },
  { id: "t2", kind: "pine", x: 425, y: 110 },
  { id: "t3", kind: "tree", x: 615, y: 118 },
  { id: "t4", kind: "pine", x: 805, y: 110 },
  { id: "t5", kind: "tree", x: 1060, y: 150 },
  { id: "t6", kind: "pine", x: 45, y: 120 },
  // Left & right edges
  { id: "t7", kind: "pine", x: 45, y: 480 },
  { id: "t8", kind: "tree", x: 1132, y: 540 },
  // Bottom strip, below the second street
  { id: "t9", kind: "tree", x: 90, y: 745 },
  { id: "t10", kind: "pine", x: 290, y: 750 },
  { id: "t11", kind: "tree", x: 470, y: 748 },
  { id: "t12", kind: "pine", x: 640, y: 752 },
  { id: "t13", kind: "tree", x: 1000, y: 748 },
  { id: "t14", kind: "pine", x: 1120, y: 750 },
  { id: "b1", kind: "bush", x: 60, y: 300 },
  { id: "b2", kind: "bush", x: 1128, y: 640 },
  { id: "b3", kind: "bush", x: 745, y: 470 },
  { id: "b4", kind: "bush", x: 60, y: 600 },
  { id: "f1", kind: "flowers", x: 236, y: 290 },
  { id: "f2", kind: "flowers", x: 805, y: 292 },
  { id: "f3", kind: "flowers", x: 745, y: 520 },
  { id: "f4", kind: "flowers", x: 380, y: 712 },
  { id: "f5", kind: "flowers", x: 880, y: 714 },
  { id: "f6", kind: "flowers", x: 1125, y: 300 },
  { id: "r1", kind: "rock", x: 560, y: 716 },
  { id: "r2", kind: "rock", x: 820, y: 750 },
  // Street lamps along both streets
  { id: "l1", kind: "lamp", x: 425, y: 308 },
  { id: "l2", kind: "lamp", x: 615, y: 308 },
  { id: "l3", kind: "lamp", x: 1040, y: 308 },
  { id: "l4", kind: "lamp", x: 1120, y: 420 },
  { id: "l5", kind: "lamp", x: 200, y: 684 },
  { id: "l6", kind: "lamp", x: 940, y: 684 },
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
