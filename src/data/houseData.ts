import type { Facing } from "@/lib/canvas/types";

export type FurnitureKind =
  | "bed"
  | "nightstand"
  | "bookshelf"
  | "laptop_desk"
  | "valorant_setup"
  | "music_corner"
  | "photo_wall"
  | "family_photo"
  | "sofa"
  | "coffee_table"
  | "trophy_case"
  | "phone_table"
  | "plant"
  | "dumbbell_rack"
  | "bench_press"
  | "treadmill"
  | "doormat";

export type RoomName = "Kamar Tidur" | "Ruang Hobi" | "Ruang Tamu" | "Ruang Gym";

/** What pressing E on a piece of furniture does besides showing its dialog */
export type FurnitureAction = "sit" | "bed" | "laptop";

export interface SeatSpot {
  x: number;
  y: number;
  facing: Facing;
}

export interface ContactLink {
  label: string;
  value: string;
  href: string;
}

export interface HouseDialogueItem {
  id: string;
  kind: FurnitureKind;
  name: string;
  room: RoomName;
  /** Center X and bottom (front edge) Y of the floor footprint */
  x: number;
  y: number;
  width: number;
  /** Depth of the floor footprint (top = y - height) */
  height: number;
  /** Whether the player collides with this item */
  solid: boolean;
  /** Draw order override (defaults to y) */
  sortY?: number;
  /** Set to false for pure decoration */
  interactive?: boolean;
  action?: FurnitureAction;
  seats?: SeatSpot[];
  /** Where the player stands after getting up */
  standSpot?: { x: number; y: number };
  speaker: string;
  pages: string[];
  tags?: string[];
  links?: ContactLink[];
  image?: { src: string; alt: string };
  isExit?: boolean;
}

export interface CatPatch {
  part: "body" | "head";
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: string;
}

export interface CatData {
  id: "graypi" | "kimmy" | "boba";
  name: string;
  gender: "jantan" | "betina";
  coat: string;
  /** Chest, belly & paw color */
  belly: string;
  /** Lower face color (bicolor muzzle) */
  muzzle?: string;
  patches: CatPatch[];
  earColors: [string, string];
  tailColor: string;
  tailTip?: string;
  earInner: string;
  eyeColor: string;
  collarColor: string;
  homeX: number;
  homeY: number;
  roamRadius: number;
  pitch: number;
  meows: string[];
  pages: string[];
}

export const HOUSE_WIDTH = 920;
export const HOUSE_HEIGHT = 640;

/** Where the player spawns inside the house (just above the front doormat) */
export const HOUSE_SPAWN = { x: 460, y: 555 };

/** Where the player returns in town when stepping out of the house */
export const TOWN_HOUSE_DOOR = { x: 180, y: 288 };

/** Drop the PNG here: public/images/family-photo.png */
export const FAMILY_PHOTO_SRC = "/images/family-photo.jpeg";

export const BUCKET_LIST = [
  "Ke Bandung",
  "Ke Jepang",
  "Lulus tepat waktu (cumlaude di semester 7)",
];

export const WORK_PLAYLIST = ["Magnolia", "Losing Us", "Apa Kabarmu?"];

export interface RoomRect {
  id: string;
  label: RoomName;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Height of the back wall face drawn at the top of the room */
  wall: number;
  floor: "wood" | "dark_wood" | "warm_wood" | "gym";
  wallpaper: "bedroom" | "hobby" | "living" | "gym";
  labelPos: { x: number; y: number };
}

export const HOUSE_ROOMS: RoomRect[] = [
  {
    id: "bedroom",
    label: "Kamar Tidur",
    x: 44,
    y: 54,
    w: 402,
    h: 258,
    wall: 46,
    floor: "wood",
    wallpaper: "bedroom",
    labelPos: { x: 340, y: 296 },
  },
  {
    id: "hobby",
    label: "Ruang Hobi",
    x: 460,
    y: 54,
    w: 416,
    h: 258,
    wall: 46,
    floor: "dark_wood",
    wallpaper: "hobby",
    labelPos: { x: 540, y: 296 },
  },
  {
    id: "living",
    label: "Ruang Tamu",
    x: 44,
    y: 328,
    w: 536,
    h: 272,
    wall: 40,
    floor: "warm_wood",
    wallpaper: "living",
    labelPos: { x: 300, y: 586 },
  },
  {
    id: "gym",
    label: "Ruang Gym",
    x: 594,
    y: 328,
    w: 282,
    h: 272,
    wall: 40,
    floor: "gym",
    wallpaper: "gym",
    labelPos: { x: 680, y: 586 },
  },
];

/** Wall caps (x, y, w, h); doorway gaps are left open */
export const HOUSE_WALLS: { x: number; y: number; w: number; h: number }[] = [
  // Top & bottom outer walls (front door gap x 405..515)
  { x: 30, y: 20, w: 860, h: 34 },
  { x: 30, y: 600, w: 375, h: 20 },
  { x: 515, y: 600, w: 375, h: 20 },
  // Left & right outer walls
  { x: 30, y: 20, w: 14, h: 600 },
  { x: 876, y: 20, w: 14, h: 600 },
  // Kamar Tidur | Ruang Hobi (doorway y 185..245)
  { x: 446, y: 54, w: 14, h: 131 },
  { x: 446, y: 245, w: 14, h: 67 },
  // Top rooms | bottom rooms (doorways x 195..265 and x 600..670)
  { x: 30, y: 312, w: 165, h: 16 },
  { x: 265, y: 312, w: 335, h: 16 },
  { x: 670, y: 312, w: 220, h: 16 },
  // Ruang Tamu | Ruang Gym (doorway y 440..515)
  { x: 580, y: 328, w: 14, h: 112 },
  { x: 580, y: 515, w: 14, h: 85 },
];

/** Openings between rooms; they also cut through back wall faces */
export const HOUSE_DOORWAYS: { x: number; y: number; w: number; h: number }[] = [
  { x: 195, y: 312, w: 70, h: 56 },
  { x: 600, y: 312, w: 70, h: 56 },
  { x: 446, y: 185, w: 14, h: 60 },
  { x: 580, y: 440, w: 14, h: 75 },
];

const ABOUT_PAGES = [
  "Kenalin, aku Azzam — seorang engineer lulusan Universitas Telkom yang saat ini berkarier di PT. Adidata Informatika.",
  "Perjalanan pendidikanku dimulai dari TK Ar Rofa, SD Fathan Mubina, SMP Roudlotul Jannah, lalu SMA/K di Wikrama Garut (tahun ke-1) & Farmako Medika Plus (tahun ke-2 & 3).",
  "Sehari-hari aku ngoding pakai TypeScript, React, Next.js, Tailwind CSS, Node.js, dan Git — plus suka eksplorasi UI/UX interaktif kayak portfolio ini.",
  "Silakan keliling rumah ini buat kenal lebih dekat soal hobi, bucket list, dan ketiga kucing kesayanganku: Gray Pi, Kimmy, dan Boba!",
];

export const ABOUT_DIALOG = {
  speaker: "💻 Tentang Azzam",
  subtitle: "Kamar Tidur · Laptop",
  pages: ABOUT_PAGES,
  tags: ["About Me", "Next.js", "TypeScript", "React"],
};

export const houseFurniture: HouseDialogueItem[] = [
  // ==================== KAMAR TIDUR ====================
  {
    id: "bed",
    kind: "bed",
    name: "Kasur & Papan Bucket List",
    room: "Kamar Tidur",
    x: 100,
    y: 214,
    width: 80,
    height: 114,
    solid: true,
    action: "bed",
    standSpot: { x: 158, y: 196 },
    speaker: "🛏️ Kasur Azzam",
    pages: ["Kasurnya empuk banget. Di papan kepala kasur ada bucket list yang ditempel."],
  },
  {
    id: "nightstand",
    kind: "nightstand",
    name: "Meja Lampu",
    room: "Kamar Tidur",
    x: 162,
    y: 128,
    width: 28,
    height: 28,
    solid: true,
    interactive: false,
    speaker: "",
    pages: [],
  },
  {
    id: "bookshelf",
    kind: "bookshelf",
    name: "Rak Buku",
    room: "Kamar Tidur",
    x: 232,
    y: 118,
    width: 70,
    height: 18,
    solid: true,
    speaker: "📚 Rak Buku",
    pages: [
      "Dulu suka baca buku novel (apalagi kalau novelnya romance).",
      "Sekarang lebih suka baca quotes sederhana dari LINE TODAY..",
    ],
    tags: ["Clean Code", "Design", "Lifelong Learner"],
  },
  {
    id: "laptop_desk",
    kind: "laptop_desk",
    name: "Meja Laptop",
    room: "Kamar Tidur",
    x: 352,
    y: 176,
    width: 104,
    height: 76,
    solid: true,
    sortY: 142,
    action: "laptop",
    seats: [{ x: 352, y: 170, facing: "up" }],
    standSpot: { x: 352, y: 192 },
    speaker: "💻 Laptop Azzam",
    pages: ["Duduk dulu di depan laptop... Mau ngapain?"],
  },

  // ==================== RUANG HOBI ====================
  {
    id: "valorant_setup",
    kind: "valorant_setup",
    name: "Setup Gaming (Valorant)",
    room: "Ruang Hobi",
    x: 560,
    y: 176,
    width: 120,
    height: 76,
    solid: true,
    sortY: 142,
    speaker: "🎮 Hobi: Gaming",
    pages: [
      "Game yang lagi sering aku mainin sekarang: VALORANT!",
      "Seru banget buat ngelatih fokus, komunikasi tim, dan ambil keputusan cepat — mirip kerja bareng tim developer.",
    ],
    tags: ["Valorant", "FPS", "Team Play"],
  },
  {
    id: "music_corner",
    kind: "music_corner",
    name: "Pojok Musik",
    room: "Ruang Hobi",
    x: 712,
    y: 138,
    width: 92,
    height: 38,
    solid: true,
    speaker: "🎧 Hobi: Musik",
    pages: [
      "Selera musikku ngikutin mood hati — hari ini bisa mellow, besok bisa semangat.",
      `Tapi kalau lagi kerja, lagu yang paling sering aku putar: ${WORK_PLAYLIST.join(", ")}.`,
    ],
    tags: WORK_PLAYLIST,
  },
  {
    id: "photo_wall",
    kind: "photo_wall",
    name: "Kamera & Galeri",
    room: "Ruang Hobi",
    x: 826,
    y: 134,
    width: 76,
    height: 34,
    solid: true,
    speaker: "📷 Hobi: Fotografi",
    pages: [
      "\"Bagi aku, foto itu sebuah kenangan untuk mengingat bahwa kita ga bisa kembali ke masa lalu.\"",
      "Kamera selalu siap buat mengabadikan momen yang nggak akan terulang dua kali.",
    ],
    tags: ["Photography", "Memories"],
  },

  // ==================== RUANG TAMU ====================
  {
    id: "family_photo",
    kind: "family_photo",
    name: "Foto Keluarga",
    room: "Ruang Tamu",
    x: 122,
    y: 372,
    width: 84,
    height: 6,
    solid: false,
    speaker: "🖼️ Foto Keluarga",
    pages: ["Foto keluarga tercinta — orang-orang yang selalu jadi alasan buat terus berkembang."],
    tags: ["Family"],
    image: { src: FAMILY_PHOTO_SRC, alt: "Foto keluarga Azzam" },
  },
  {
    id: "sofa",
    kind: "sofa",
    name: "Sofa Ruang Tamu",
    room: "Ruang Tamu",
    x: 340,
    y: 418,
    width: 150,
    height: 50,
    solid: true,
    action: "sit",
    seats: [
      { x: 306, y: 420, facing: "down" },
      { x: 374, y: 420, facing: "down" },
    ],
    standSpot: { x: 340, y: 446 },
    speaker: "🛋️ Sofa",
    pages: [],
  },
  {
    id: "coffee_table",
    kind: "coffee_table",
    name: "Meja Kopi",
    room: "Ruang Tamu",
    x: 340,
    y: 486,
    width: 92,
    height: 30,
    solid: true,
    interactive: false,
    speaker: "",
    pages: [],
  },
  {
    id: "trophy_case",
    kind: "trophy_case",
    name: "Lemari Pajangan Karier",
    room: "Ruang Tamu",
    x: 516,
    y: 392,
    width: 72,
    height: 22,
    solid: true,
    speaker: "🏆 Perjalanan Karier",
    pages: [
      "Kenang-kenangan perjalanan karier: CV Sinang Permata Group, PT. Geomatika Satelit Indonesia, hingga PT. Adidata Informatika saat ini.",
      "Setiap tempat memberikan pelajaran berharga tentang kolaborasi tim, kualitas kode, dan membangun produk yang bermanfaat.",
    ],
    tags: ["Career", "Milestones"],
  },
  {
    id: "phone_table",
    kind: "phone_table",
    name: "Meja Telepon (Kontak)",
    room: "Ruang Tamu",
    x: 82,
    y: 578,
    width: 52,
    height: 30,
    solid: true,
    speaker: "☎️ Kontak & Kolaborasi",
    pages: [
      "Tertarik diskusi, kolaborasi proyek, atau sekadar menyapa? Jangan ragu buat menghubungi!",
      "📞 Contact / WhatsApp: 081384197696\n✉️ Email: azzamrafizafran@gmail.com\n💼 LinkedIn: linkedin.com/in/azzamrafizafran\n🐙 GitHub: github.com/azmrfii",
    ],
    links: [
      { label: "📞 081384197696", value: "081384197696", href: "https://wa.me/6281384197696" },
      { label: "✉️ Email", value: "azzamrafizafran@gmail.com", href: "mailto:azzamrafizafran@gmail.com" },
      { label: "💼 LinkedIn", value: "linkedin.com/in/azzamrafizafran", href: "https://www.linkedin.com/in/azzamrafizafran/" },
      { label: "🐙 GitHub", value: "github.com/azmrfii", href: "https://github.com/azmrfii" },
    ],
    // tags: ["081384197696", "GitHub", "LinkedIn", "Email"],
  },
  {
    id: "plant",
    kind: "plant",
    name: "Tanaman Monstera",
    room: "Ruang Tamu",
    x: 556,
    y: 590,
    width: 32,
    height: 22,
    solid: true,
    interactive: false,
    speaker: "",
    pages: [],
  },
  {
    id: "plant_corner",
    kind: "plant",
    name: "Tanaman Sudut",
    room: "Ruang Tamu",
    x: 62,
    y: 392,
    width: 32,
    height: 22,
    solid: true,
    interactive: false,
    speaker: "",
    pages: [],
  },

  // ==================== RUANG GYM ====================
  {
    id: "dumbbell_rack",
    kind: "dumbbell_rack",
    name: "Rak Dumbbell",
    room: "Ruang Gym",
    x: 776,
    y: 394,
    width: 100,
    height: 24,
    solid: true,
    speaker: "🏋️ Rak Dumbbell",
    pages: ["Dumbbell dari yang ringan sampai berat — buat latihan tangan, bahu, dan punggung."],
    tags: ["Gym", "Strength"],
  },
  {
    id: "bench_press",
    kind: "bench_press",
    name: "Bench Press",
    room: "Ruang Gym",
    x: 730,
    y: 506,
    width: 112,
    height: 46,
    solid: true,
    speaker: "💪 Hobi: Gym",
    pages: [
      "Olahraga favoritku: GYM!",
      "Biar badan tetap bugar setelah seharian duduk di depan layar — dan pikiran jadi lebih segar buat ngoding lagi.",
    ],
    tags: ["Gym", "Healthy Mind", "Consistency"],
  },
  {
    id: "treadmill",
    kind: "treadmill",
    name: "Treadmill",
    room: "Ruang Gym",
    x: 842,
    y: 588,
    width: 44,
    height: 96,
    solid: true,
    speaker: "🏃 Treadmill",
    pages: ["Mending lari di atas treadmill, dari pada lari ngejar dia yang ga bisa digapai."],
    tags: ["Cardio"],
  },

  // ==================== PINTU KELUAR ====================
  {
    id: "doormat",
    kind: "doormat",
    name: "Pintu Keluar menuju Kota",
    room: "Ruang Tamu",
    x: 460,
    y: 594,
    width: 96,
    height: 30,
    solid: false,
    sortY: 0,
    speaker: "🚪 Pintu Depan",
    pages: ["Kembali keluar menuju halaman kota."],
    isExit: true,
  },
];

const WHITE = "#fbf8f2";
const GRAY = "#8c929b";
const CREAM = "#e9c48f";

export const houseCats: CatData[] = [
  {
    id: "graypi",
    name: "Gray Pi",
    gender: "jantan",
    coat: GRAY,
    belly: WHITE,
    muzzle: WHITE,
    patches: [],
    earColors: [GRAY, GRAY],
    tailColor: GRAY,
    tailTip: WHITE,
    earInner: "#f4afb4",
    eyeColor: "#a3c94a",
    collarColor: "#2563eb",
    homeX: 250,
    homeY: 236,
    roamRadius: 70,
    pitch: 0.88,
    meows: ["Meong~ 🐾", "Prrr...", "Miaw!"],
    pages: [
      "🐾 Gray Pi (Kucing Jantan) — Dulu anteng pas masih kecil, takut kalau mau disentuh, tapi udah agak gedenya malah nyamperin mulu.",
      "Kamu kemana Gray Pi, kenapa ga pulang pulang sampe sekarang..",
    ],
  },
  {
    id: "kimmy",
    name: "Kimmy",
    gender: "betina",
    coat: WHITE,
    belly: WHITE,
    patches: [
      { part: "body", x: -1, y: -3, rx: 8, ry: 4.5, color: CREAM },
      { part: "body", x: -10, y: -1, rx: 5, ry: 6, color: GRAY },
      { part: "head", x: -3, y: -5, rx: 6, ry: 4.5, color: GRAY },
      { part: "head", x: 5, y: -6, rx: 3.5, ry: 3, color: CREAM },
    ],
    earColors: [GRAY, CREAM],
    tailColor: GRAY,
    earInner: "#fda4af",
    eyeColor: "#38bdf8",
    collarColor: "#ec4899",
    homeX: 230,
    homeY: 500,
    roamRadius: 80,
    pitch: 1.18,
    meows: ["Miuw~ 💕", "Meow!", "Purrr~"],
    pages: [
      "🐾 Kimmy (Kucing Betina) — Anaknya boba, kalau pintu dibuka suka lari nyelonong masuk.",
      "Pengennya dimanja!",
    ],
  },
  {
    id: "boba",
    name: "Boba",
    gender: "betina",
    coat: WHITE,
    belly: WHITE,
    patches: [
      { part: "body", x: 1, y: -3.5, rx: 8, ry: 4.5, color: GRAY },
      { part: "body", x: -9, y: -1, rx: 5, ry: 5.5, color: CREAM },
      { part: "head", x: -3, y: -5, rx: 5, ry: 4.5, color: CREAM },
      { part: "head", x: 4.5, y: -5.5, rx: 3.5, ry: 3, color: GRAY },
    ],
    earColors: [CREAM, GRAY],
    tailColor: CREAM,
    earInner: "#f9a8d4",
    eyeColor: "#e0a83a",
    collarColor: "#a855f7",
    homeX: 680,
    homeY: 250,
    roamRadius: 75,
    pitch: 1.08,
    meows: ["Meow~ 🧋", "Nyaa!", "Prrr~"],
    pages: [
      "🐾 Boba (Kucing Betina) — Ibunya Kimmy: Pulang kerumah kalau lagi bunting doang.",
      "Suka nyelonong lewat jendela kalau dibuka, sempet naro anaknya habis lahiran di lemari baju.",
    ],
  },
];

export function getFurnitureRect(f: HouseDialogueItem) {
  return {
    left: f.x - f.width / 2,
    right: f.x + f.width / 2,
    top: f.y - f.height,
    bottom: f.y,
  };
}

function inDoorway(x: number, y: number): boolean {
  return HOUSE_DOORWAYS.some(
    (d) => x > d.x + 8 && x < d.x + d.w - 8 && y >= d.y - 6 && y <= d.y + d.h + 8,
  );
}

export function isHouseBlocked(x: number, y: number): boolean {
  if (x < 52 || x > HOUSE_WIDTH - 52 || y > HOUSE_HEIGHT - 44) {
    const nearExit = Math.abs(x - 460) < 42 && y >= 540 && y <= 604;
    if (!nearExit) return true;
  }

  for (const w of HOUSE_WALLS) {
    if (x > w.x - 10 && x < w.x + w.w + 10 && y > w.y - 4 && y < w.y + w.h + 10) {
      return true;
    }
  }

  // Back wall faces at the top of each room
  for (const r of HOUSE_ROOMS) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y < r.y + r.wall + 8 && !inDoorway(x, y)) {
      return true;
    }
  }

  for (const f of houseFurniture) {
    if (!f.solid) continue;
    const r = getFurnitureRect(f);
    if (x > r.left - 8 && x < r.right + 8 && y > r.top + 4 && y < r.bottom + 6) {
      return true;
    }
  }

  return false;
}
