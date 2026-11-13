import type { CharacterLook } from "@/data/worldData";
import type { Facing } from "@/lib/canvas/types";

export interface AglNpcData {
  id: string;
  name: string;
  role: string;
  gender: "male" | "female";
  x: number;
  y: number;
  facing: Facing;
  dancing?: boolean;
  /** Seated on a lounge sofa */
  sitting?: boolean;
  /** Y the player stands at to talk (for NPCs behind a counter or booth) */
  talkY?: number;
  look: CharacterLook;
  greetings: string[];
  pages: string[];
  choices?: { id: string; label: string }[];
  tags?: string[];
}

export interface AglFurnitureItem {
  id: string;
  name: string;
  /** Center X and bottom (front edge) Y of the floor footprint */
  x: number;
  y: number;
  width: number;
  /** Depth of the floor footprint (top = y - height) */
  height: number;
  solid: boolean;
  sortY?: number;
  interactive?: boolean;
  action?: "sit";
  seats?: { x: number; y: number; facing: Facing }[];
  standSpot?: { x: number; y: number };
  speaker: string;
  pages: string[];
  tags?: string[];
  choices?: { id: string; label: string }[];
  isExit?: boolean;
}

export const AGL_WIDTH = 920;
export const AGL_HEIGHT = 640;

export const AGL_SPAWN = { x: 460, y: 550 };
export const TOWN_AGL_DOOR = { x: 740, y: 288 };

/** Bottom edge of the tall back wall face */
export const AGL_BACK_WALL_BOTTOM = 112;

/** Wall caps (x, y, w, h); front door gap x 405..515 */
export const AGL_WALLS: { x: number; y: number; w: number; h: number }[] = [
  { x: 30, y: 20, w: 860, h: 34 },
  { x: 30, y: 600, w: 375, h: 20 },
  { x: 515, y: 600, w: 375, h: 20 },
  { x: 30, y: 20, w: 14, h: 600 },
  { x: 876, y: 20, w: 14, h: 600 },
];

/** Floor zones */
export const AGL_ZONES = {
  stage: { x: 60, y: 112, w: 270, h: 140 },
  bar: { x: 556, y: 112, w: 320, h: 150 },
  dance: { x: 350, y: 276, w: 220, h: 148 },
  loungeLeft: { x: 62, y: 424, w: 236, h: 164 },
  loungeRight: { x: 622, y: 424, w: 236, h: 164 },
};

/** Where Dymas walks behind the bar, and the X of each back-bar station */
export const BAR_WALK_Y = 158;
export const BAR_STATIONS = {
  glass: 604,
  ice: 650,
  blender: 752,
  soda: 812,
  center: 712,
};
/** Top surface of the bar counter where drinks are set down */
export const BAR_COUNTER_TOP_Y = 160;
/** Top surface of the back cabinet where Dymas works */
export const BAR_BACK_TOP_Y = 110;
export const BAR_SERVE_RANGE = { min: 604, max: 820 };

export const aglFurniture: AglFurnitureItem[] = [
  // ==================== DJ STAGE ====================
  {
    id: "dj_stage",
    name: "Panggung DJ",
    x: 195,
    y: 252,
    width: 270,
    height: 132,
    solid: true,
    sortY: 120,
    interactive: false,
    speaker: "",
    pages: [],
  },
  {
    id: "dj_speaker_left",
    name: "Subwoofer Kiri",
    x: 86,
    y: 214,
    width: 34,
    height: 24,
    solid: true,
    speaker: "🔊 Tower Subwoofer",
    pages: ["Bass-nya berasa getar sampai ke dada! Output audio jernih buat menghentak lantai dansa."],
  },
  {
    id: "dj_speaker_right",
    name: "Subwoofer Kanan",
    x: 304,
    y: 214,
    width: 34,
    height: 24,
    solid: true,
    speaker: "🔊 Tower Subwoofer",
    pages: ["Dentuman beat-nya ga ada obat, bikin siapa pun yang masuk AGL otomatis goyang kepala."],
  },
  {
    id: "dj_booth",
    name: "DJ Booth & Turntable",
    x: 195,
    y: 222,
    width: 136,
    height: 30,
    solid: true,
    speaker: "🎧 DJ Booth — Valdy's Deck",
    pages: [
      "Mixer, dual turntable, laptop DJ, dan tata lampu neon yang sinkron sama ketukan musik.",
      "Valdy yang mengontrol semua playlist dan sound effect di AGL malam ini!",
    ],
    tags: ["DJ Booth", "Sound System", "EDM & Chill"],
  },

  // ==================== BAR ====================
  {
    id: "bar_back",
    name: "Rak Bar Belakang",
    x: 716,
    y: 172,
    width: 320,
    height: 52,
    solid: true,
    sortY: 128,
    interactive: false,
    speaker: "",
    pages: [],
  },
  {
    id: "bar_counter",
    name: "Meja Bar",
    x: 712,
    y: 210,
    width: 276,
    height: 38,
    solid: true,
    speaker: "🍹 Bar & Mocktail Corner",
    pages: [],
    tags: ["Barista Dymas"],
  },
  {
    id: "bar_stools",
    name: "Kursi Bar",
    x: 712,
    y: 236,
    width: 240,
    height: 14,
    solid: false,
    sortY: 230,
    action: "sit",
    seats: [
      { x: 622, y: 232, facing: "up" },
      { x: 682, y: 232, facing: "up" },
      { x: 742, y: 232, facing: "up" },
      { x: 802, y: 232, facing: "up" },
    ],
    standSpot: { x: 712, y: 258 },
    speaker: "🪑 Kursi Bar",
    pages: ["Duduk santai di depan meja bar sambil ngeliatin Dymas meracik minuman."],
  },

  // ==================== LOUNGE ====================
  {
    id: "lounge_sofa_left",
    name: "Sofa Velvet Kiri",
    x: 180,
    y: 472,
    width: 186,
    height: 46,
    solid: true,
    action: "sit",
    seats: [{ x: 238, y: 474, facing: "down" }],
    standSpot: { x: 238, y: 500 },
    speaker: "🛋️ VIP Velvet Lounge",
    pages: ["Sofa beludru ungu yang empuk banget. Tempat favorit Kaila dan Syifa buat ngobrol."],
    tags: ["Cozy VIP", "Hangout"],
  },
  {
    id: "lounge_table_left",
    name: "Meja Lounge Kiri",
    x: 180,
    y: 546,
    width: 96,
    height: 30,
    solid: true,
    interactive: false,
    speaker: "",
    pages: [],
  },
  {
    id: "lounge_sofa_right",
    name: "Sofa Velvet Kanan",
    x: 740,
    y: 472,
    width: 186,
    height: 46,
    solid: true,
    action: "sit",
    seats: [
      { x: 682, y: 474, facing: "down" },
      { x: 740, y: 474, facing: "down" },
    ],
    standSpot: { x: 712, y: 500 },
    speaker: "🛋️ VIP Velvet Lounge",
    pages: ["Sofa santai dengan view langsung ke lantai dansa. Di meja ada camilan dan mocktail dingin."],
    tags: ["Lounge", "Friends"],
  },
  {
    id: "lounge_table_right",
    name: "Meja Lounge Kanan",
    x: 740,
    y: 546,
    width: 96,
    height: 30,
    solid: true,
    interactive: false,
    speaker: "",
    pages: [],
  },

  // ==================== PHOTOBOX & ARCADE ====================
  {
    id: "photobox",
    name: "AGL Photobox",
    x: 838,
    y: 372,
    width: 60,
    height: 40,
    solid: true,
    speaker: "📸 Photobox AGL",
    pages: [
      "Bilik photobox neon estetik! Penuh tempelan strip foto seru bareng teman-teman rumah.",
      "\"Momen seru bareng teman rumah itu gak bakal lekang oleh waktu!\" — AGL Family",
    ],
    tags: ["Photobox", "Memories", "Besties"],
  },
  {
    id: "arcade_machine",
    name: "Mesin Arcade Retro",
    x: 82,
    y: 372,
    width: 48,
    height: 30,
    solid: true,
    speaker: "🕹️ Mesin Arcade AGL",
    pages: ["Mesin game fighting & rhythm retro 90-an. Rekor skor tertinggi masih dipegang anak-anak AGL!"],
    tags: ["Retro Game", "High Score"],
  },

  // ==================== PINTU KELUAR ====================
  {
    id: "doormat",
    name: "Pintu Keluar menuju Kota",
    x: 460,
    y: 596,
    width: 100,
    height: 28,
    solid: false,
    sortY: 0,
    speaker: "🚪 Pintu Keluar AGL",
    pages: ["Kembali keluar ke jalan kota."],
    isExit: true,
  },
];

export type DrinkId = "sprite" | "cola" | "popice";

export interface DrinkData {
  id: DrinkId;
  name: string;
  badge: string;
  color: string;
  accent: string;
  cupColor: string;
  craftText: string;
  pourText: string;
  garnishText: string;
  serveDialog: string;
  reactionDialog: string;
}

export const DRINKS: Record<DrinkId, DrinkData> = {
  sprite: {
    id: "sprite",
    name: "Sprite",
    badge: "🥤 Sprite Segar",
    color: "#4ade80",
    accent: "#ffffff",
    cupColor: "#15803d",
    craftText: "Menuang Sprite dingin & es batu...",
    pourText: "Tuang Sprite dingin...",
    garnishText: "Tambah irisan lemon & sedotan",
    serveDialog: "Nih Zam! Sprite dingin lemon-lime extra es batu biar tenggorokan seger!",
    reactionDialog: "Sluuurrp... Gleg gleg gleg... Ahhhh, desis sodanya bener-bener nyegerin tenggorokan!",
  },
  cola: {
    id: "cola",
    name: "Coca Cola",
    badge: "🥤 Coca Cola Dingin",
    color: "#7c2d12",
    accent: "#f87171",
    cupColor: "#b91c1c",
    craftText: "Menuang Coca Cola berbuih mantap...",
    pourText: "Tuang Coca Cola berbuih...",
    garnishText: "Tambah es & sedotan merah",
    serveDialog: "Ini dia Coca Cola klasik dingin buat lu Zam! Rasa karamel dan sodanya bikin mood langsung melek!",
    reactionDialog: "Gleg... gleg... Glek! Haaahh! Dingin semriwing, energi ngoding langsung keisi penuh!",
  },
  popice: {
    id: "popice",
    name: "Pop Ice",
    badge: "🧋 Pop Ice Cokelat",
    color: "#8b5a3c",
    accent: "#ec4899",
    cupColor: "#a855f7",
    craftText: "Memblender Pop Ice cokelat & meses...",
    pourText: "Blender Pop Ice cokelat...",
    garnishText: "Tabur meses & pasang tutup",
    serveDialog: "Nostalgia zaman sekolah nih Zam! Pop Ice cokelat kental diblender halus plus taburan meses melimpah!",
    reactionDialog: "Sluuurrrp... Sllluuurpp! Mmmhh manis creamy banget, serasa balik ke masa kecil sepulang sekolah!",
  },
};

export const aglNpcs: AglNpcData[] = [
  {
    id: "dymas",
    name: "Dymas",
    role: "Barista AGL",
    gender: "male",
    x: BAR_STATIONS.center,
    y: BAR_WALK_Y,
    facing: "down",
    talkY: 240,
    look: {
      skin: "#e8b48a",
      hair: "#1f1a17",
      hairStyle: "short",
      shirt: "#1e293b",
      pants: "#334155",
      shoes: "#0f172a",
    },
    greetings: [
      "Mau pesen Sprite, Cola, atau Pop Ice Zam?",
      "Sprite dingin ready, es batunya banyakin!",
      "Pop Ice blender cokelat lagi favorit nih!",
    ],
    pages: [
      "Yo Azzam! Selamat datang di bar AGL! Gua yang megang racikan minuman di sini malam ini.",
      "Mau Sprite yang seger lemon-lime, Coca Cola dingin klasik, atau Pop Ice blender cokelat nostalgia?",
    ],
    choices: [
      { id: "drink_sprite", label: "🥤 Sprite (Dingin & Segar)" },
      { id: "drink_cola", label: "🥤 Coca Cola (Klasik Berbuih)" },
      { id: "drink_popice", label: "🧋 Pop Ice (Blender Cokelat & Meses)" },
      { id: "chat", label: "💬 Ngobrol Santai" },
    ],
    tags: ["Barista Dymas", "Minuman Dingin", "AGL Bar"],
  },
  {
    id: "valdy",
    name: "Valdy",
    role: "DJ AGL",
    gender: "male",
    x: 195,
    y: 190,
    facing: "down",
    dancing: true,
    talkY: 268,
    look: {
      skin: "#f2c39b",
      hair: "#475569",
      hairStyle: "spiky",
      shirt: "#ec4899",
      pants: "#0f172a",
      shoes: "#f8fafc",
    },
    greetings: ["Drop the beat! 🎧", "Lagu berikutnya request apa Zam?", "Vibes AGL malam ini pecah!"],
    pages: [
      "Wassup Zam! DJ Valdy in the house! Playlist malam ini udah gua set biar anak-anak AGL tetep semangat.",
      "Dari beat santai lo-fi house sampe EDM jedag-jedug, tinggal bilang aja mau vibes kayak gimana!",
    ],
    choices: [
      { id: "drop_beat", label: "🔥 Drop beat kenceng Val!" },
      { id: "chill_music", label: "🎧 Putar lagu chill dulu" },
      { id: "compliment", label: "✨ Playlist lu emang gacor" },
    ],
    tags: ["DJ", "Music Producer", "AGL Beats"],
  },
  {
    id: "rafly",
    name: "Rafly",
    role: "Teman Rumah",
    gender: "male",
    x: 420,
    y: 344,
    facing: "down",
    dancing: true,
    look: {
      skin: "#f6cfa8",
      hair: "#2b1d14",
      hairStyle: "spiky",
      shirt: "#3b82f6",
      pants: "#1e293b",
      shoes: "#f8fafc",
    },
    greetings: ["Sini Zam joget!", "Vibes malam ini pecah banget haha", "Azzam akhirnya nongol!"],
    pages: [
      "Woi Azzam! Akhirnya nongol juga lu. Tadi abis nugas codingan apa gimana nih?",
      "Mumpung kumpul lengkap di AGL, jangan mikirin bug dulu, enjoy the music bro!",
    ],
    tags: ["Party Mood", "Bestie", "Dancer"],
  },
  {
    id: "noval",
    name: "Noval",
    role: "Teman Rumah",
    gender: "male",
    x: 504,
    y: 360,
    facing: "down",
    dancing: true,
    look: {
      skin: "#e8b48a",
      hair: "#1c1917",
      hairStyle: "short",
      shirt: "#10b981",
      pants: "#374151",
      shoes: "#111827",
    },
    greetings: ["Santai dulu ga sih Zam~", "Mantap bener AGL hari ini", "Udah nyobain racikan Dymas?"],
    pages: [
      "Halo Azzam! Gua lagi nikmatin racikan minumannya Dymas sambil dengerin beat-nya Valdy.",
      "Emang tempat paling pas buat ngilangin penat ya kumpul bareng anak-anak rumah kayak gini.",
    ],
    tags: ["Chill Guy", "Good Vibes"],
  },
  {
    id: "kaila",
    name: "Kaila",
    role: "Teman Rumah",
    gender: "female",
    x: 122,
    y: 474,
    facing: "down",
    sitting: true,
    look: {
      skin: "#f6cfa8",
      hair: "#451a03",
      hairStyle: "ponytail",
      shirt: "#f43f5e",
      pants: "#1f2937",
      shoes: "#f8fafc",
    },
    greetings: ["Hai Azzam! Sini duduk", "Seru banget hari ini ✨", "Azzam akhirnya mampir!"],
    pages: [
      "Hai Azzam! Akhirnya nyempetin mampir ke AGL! Dari tadi kita lagi cerita-cerita seru nih.",
      "Keren banget deh portfolio kamu yang ini, bisa jalan-jalan kayak main game beneran!",
    ],
    tags: ["Lounge Crew", "Friendly", "AGL Girls"],
  },
  {
    id: "syifa",
    name: "Syifa",
    role: "Teman Rumah",
    gender: "female",
    x: 180,
    y: 474,
    facing: "down",
    sitting: true,
    look: {
      skin: "#f2c39b",
      hair: "#292524",
      hairStyle: "long",
      shirt: "#8b5cf6",
      pants: "#334155",
      shoes: "#f8fafc",
    },
    greetings: ["Azzam! Cobain racikan Dymas deh", "Lagunya asik banget~ 🎶", "Halo Azzam!"],
    pages: [
      "Halo Azzam! Tadi Valdy baru muter lagu favorit kita. Kamu udah pesen minum ke Dymas belum?",
      "Seneng banget bisa kumpul rame-rame di AGL gini, berasa nostalgia masa-masa main bareng.",
    ],
    tags: ["Music Lover", "Always Cheerful"],
  },
  {
    id: "aliyah",
    name: "Aliyah",
    role: "Teman Rumah",
    gender: "female",
    x: 798,
    y: 474,
    facing: "down",
    sitting: true,
    look: {
      skin: "#f6cfa8",
      hair: "#5c3a21",
      hairStyle: "bob",
      shirt: "#f59e0b",
      pants: "#1e293b",
      shoes: "#f8fafc",
    },
    greetings: ["Hai Zam! Foto bareng yuk 📸", "Vibes diskotiknya kece parah", "Seru banget kumpul di AGL!"],
    pages: [
      "Hai Azzam! Barusan aku sama Kaila & Syifa abis foto-foto di photobox, lightingnya bagus banget!",
      "Sukses terus ya buat kerjaan dan kuliahmu. Jangan lupa sering-sering luangin waktu main bareng kita!",
    ],
    tags: ["Photobox Queen", "Supportive", "AGL Girls"],
  },
];

export function getAglFurnitureRect(f: AglFurnitureItem) {
  return {
    left: f.x - f.width / 2,
    right: f.x + f.width / 2,
    top: f.y - f.height,
    bottom: f.y,
  };
}

export function isAglBlocked(x: number, y: number): boolean {
  if (x < 52 || x > AGL_WIDTH - 52 || y < AGL_BACK_WALL_BOTTOM + 8 || y > AGL_HEIGHT - 44) {
    const nearExit = Math.abs(x - 460) < 46 && y >= 540 && y <= 606;
    if (!nearExit) return true;
  }

  for (const f of aglFurniture) {
    if (!f.solid) continue;
    const r = getAglFurnitureRect(f);
    if (x > r.left - 8 && x < r.right + 8 && y > r.top + 4 && y < r.bottom + 6) return true;
  }

  return false;
}
