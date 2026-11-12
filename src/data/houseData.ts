export type FurnitureKind =
  | "bed"
  | "pc_desk"
  | "bookshelf"
  | "corkboard"
  | "console_tv"
  | "guitar"
  | "photo_wall"
  | "sports_rack"
  | "sofa_table"
  | "trophy_case"
  | "family_frame"
  | "plant"
  | "phone_table"
  | "kitchen_counter"
  | "fridge"
  | "dining_table"
  | "doormat";

export interface HouseDialogueItem {
  id: string;
  kind: FurnitureKind;
  name: string;
  room: "Kamar & Workspace" | "Ruang Hobi" | "Ruang Tamu" | "Dapur";
  /** Center X and bottom (ground) Y of the furniture */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Whether the player collides with this item */
  solid: boolean;
  /** RPG dialog pages shown when inspected */
  speaker: string;
  pages: string[];
  tags?: string[];
  isExit?: boolean;
}

export interface CatData {
  id: "graypi" | "kimmy" | "boba";
  name: string;
  gender: "jantan" | "betina";
  coat: string;
  secondaryCoat: string;
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
export const TOWN_HOUSE_DOOR = { x: 140, y: 280 };

/** Interior rooms (for floor coloring & labels) */
export interface RoomRect {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: "wood" | "warm_wood" | "tile" | "rug_room";
}

export const HOUSE_ROOMS: RoomRect[] = [
  {
    id: "workspace",
    label: "Kamar & Workspace",
    x: 40,
    y: 50,
    w: 410,
    h: 265,
    floor: "wood",
  },
  {
    id: "hobby",
    label: "Ruang Hobi (Game · Musik · Foto · Olahraga)",
    x: 460,
    y: 50,
    w: 420,
    h: 265,
    floor: "warm_wood",
  },
  {
    id: "living",
    label: "Ruang Tamu",
    x: 40,
    y: 325,
    w: 540,
    h: 275,
    floor: "rug_room",
  },
  {
    id: "kitchen",
    label: "Dapur & Ruang Makan",
    x: 590,
    y: 325,
    w: 290,
    h: 275,
    floor: "tile",
  },
];

/** Interior partition wall segments (x, y, w, h) with doorways left open */
export const HOUSE_WALLS: { x: number; y: number; w: number; h: number }[] = [
  // Top & bottom outer walls
  { x: 30, y: 20, w: 860, h: 34 },
  { x: 30, y: 600, w: 375, h: 20 },
  { x: 515, y: 600, w: 375, h: 20 },
  // Left & right outer walls
  { x: 30, y: 20, w: 14, h: 595 },
  { x: 876, y: 20, w: 14, h: 595 },
  // Vertical divider between Kamar/Workspace and Ruang Hobi (doorway gap y: 185..245)
  { x: 446, y: 50, w: 14, h: 135 },
  { x: 446, y: 245, w: 14, h: 75 },
  // Horizontal divider between top rooms and bottom rooms (two doorway gaps)
  { x: 40, y: 312, w: 155, h: 16 },
  { x: 265, y: 312, w: 335, h: 16 },
  { x: 670, y: 312, w: 210, h: 16 },
  // Vertical divider between Ruang Tamu and Dapur (doorway gap y: 440..515)
  { x: 580, y: 325, w: 14, h: 115 },
  { x: 580, y: 515, w: 14, h: 85 },
];

export const houseFurniture: HouseDialogueItem[] = [
  // ==================== KAMAR & WORKSPACE ====================
  {
    id: "pc_desk",
    kind: "pc_desk",
    name: "Meja Kerja & Dual Monitor Setup",
    room: "Kamar & Workspace",
    x: 135,
    y: 122,
    width: 110,
    height: 46,
    solid: true,
    speaker: "💻 Meja Kerja & PC Setup",
    pages: [
      "Di sinilah baris demi baris kode ditulis setiap hari — ditemani secangkir kopi hangat dan playlist favorit.",
      "Stack & tools sehari-hari: TypeScript, React, Next.js, Tailwind CSS, Node.js, Git, serta eksplorasi UI/UX interaktif.",
      "(Placeholder: kamu bisa edit bagian ini di src/data/houseData.ts untuk menambahkan spesifikasi setup atau workflow favoritmu!)",
    ],
    tags: ["Next.js", "TypeScript", "React", "UI/UX"],
  },
  {
    id: "bookshelf",
    kind: "bookshelf",
    name: "Rak Buku & Referensi",
    room: "Kamar & Workspace",
    x: 275,
    y: 108,
    width: 78,
    height: 42,
    solid: true,
    speaker: "📚 Rak Buku & Catatan",
    pages: [
      "Kumpulan buku software engineering, desain produk, pengembangan diri, dan beberapa komik favorit.",
      "Selalu senang mempelajari hal baru — mulai dari arsitektur frontend hingga cara membuat web terasa hidup seperti game.",
    ],
    tags: ["Clean Code", "Design", "Lifelong Learner"],
  },
  {
    id: "corkboard",
    kind: "corkboard",
    name: "Papan Target & Ide",
    room: "Kamar & Workspace",
    x: 382,
    y: 96,
    width: 58,
    height: 28,
    solid: false,
    speaker: "📌 Papan Visi & Goals",
    pages: [
      "Penuh sticky notes berisi ide side-project, target karier, dan daftar tempat yang ingin dikunjungi.",
      "Prinsip kerja: selesaikan satu per satu dengan rapi, konsisten, dan berdampak nyata buat pengguna.",
    ],
    tags: ["Goals", "Roadmap", "Product Craft"],
  },
  {
    id: "bed",
    kind: "bed",
    name: "Kasur Nyaman",
    room: "Kamar & Workspace",
    x: 108,
    y: 255,
    width: 82,
    height: 64,
    solid: true,
    speaker: "🛏️ Kasur Kesayangan",
    pages: [
      "Zzz... kelihatannya empuk banget, apalagi kadang direbut sama Gray Pi, Kimmy, dan Boba.",
      "Tapi belum waktunya tidur! Masih banyak sudut rumah dan kota yang bisa dijelajahi.",
    ],
    tags: ["Rest", "Recharge"],
  },

  // ==================== RUANG HOBI ====================
  {
    id: "console_tv",
    kind: "console_tv",
    name: "Pojok Gaming & Konsol",
    room: "Ruang Hobi",
    x: 545,
    y: 120,
    width: 112,
    height: 48,
    solid: true,
    speaker: "🎮 Hobi: Gaming",
    pages: [
      "Tempat melepas penat lewat petualangan RPG, game strategi, dan co-op bareng teman-teman.",
      "Dari game juga muncul inspirasi untuk membuat portfolio interaktif bergaya pixel town ini!",
      "(Placeholder: tulis judul game favoritmu di sini — misalnya RPG, indie, atau kompetitif favoritmu.)",
    ],
    tags: ["Gaming", "RPG", "Interactive Media"],
  },
  {
    id: "guitar",
    kind: "guitar",
    name: "Gitar Akustik & Speaker Musik",
    room: "Ruang Hobi",
    x: 680,
    y: 122,
    width: 68,
    height: 44,
    solid: true,
    speaker: "🎸 Hobi: Musik",
    pages: [
      "Musik selalu jadi teman setia waktu ngoding fokus maupun saat santai sore hari.",
      "Kadang petik gitar akustik atau dengerin playlist lintas genre untuk menjaga mood tetap asik.",
      "(Placeholder: tambahkan band, musisi, atau lagu favoritmu di src/data/houseData.ts!)",
    ],
    tags: ["Music", "Acoustic", "Good Vibes"],
  },
  {
    id: "photo_wall",
    kind: "photo_wall",
    name: "Dinding Galeri & Kamera Analog/Mirrorless",
    room: "Ruang Hobi",
    x: 805,
    y: 118,
    width: 96,
    height: 44,
    solid: true,
    speaker: "📷 Hobi: Fotografi & Kenangan",
    pages: [
      "\"Bagi gw, foto itu kenangan ketika kita ga bisa kembali ke masa lalu.\"",
      "Setiap bingkai di dinding ini menyimpan cerita: perjalanan, tawa teman-teman, keluarga, dan momen kecil yang berharga.",
      "Kamera selalu siap di meja untuk mengabadikan detik-detik yang tidak akan terulang dua kali.",
    ],
    tags: ["Photography", "Memories", "Storytelling"],
  },
  {
    id: "sports_rack",
    kind: "sports_rack",
    name: "Rak Alat Olahraga",
    room: "Ruang Hobi",
    x: 815,
    y: 258,
    width: 86,
    height: 44,
    solid: true,
    speaker: "⚽ Hobi: Olahraga",
    pages: [
      "Supaya badan tetap bugar setelah seharian duduk di depan layar monitor!",
      "Rutin olahraga bikin pikiran lebih segar, fokus terjaga, dan energi selalu siap buat tantangan baru.",
      "(Placeholder: sebutkan olahraga favoritmu — futsal, badminton, lari, gym, atau bersepeda!)",
    ],
    tags: ["Sports", "Healthy Mind", "Active"],
  },

  // ==================== RUANG TAMU ====================
  {
    id: "family_frame",
    kind: "family_frame",
    name: "Bingkai Profil & Tentang Azzam",
    room: "Ruang Tamu",
    x: 135,
    y: 356,
    width: 84,
    height: 26,
    solid: false,
    speaker: "🖼️ Halo! Selamat Datang di Rumah Azzam",
    pages: [
      "Kenalin, aku Azzam — seorang engineer lulusan Universitas Telkom yang saat ini berkarier di PT. Adidata Informatika.",
      "Perjalanan pendidikanku dimulai dari TK Ar Rofa, SD Fathan Mubina, SMP Roudlotul Jannah, lalu SMA/K di Wikrama Garut (tahun ke-1) & Farmako Medika Plus (tahun ke-2 & 3).",
      "Silakan keliling rumah ini untuk kenal lebih dekat soal hobi, keseharian, dan ketiga kucing kesayanganku: Gray Pi, Kimmy, dan Boba!",
    ],
    tags: ["About Me", "Azzam", "Welcome"],
  },
  {
    id: "sofa_table",
    kind: "sofa_table",
    name: "Sofa Ruang Tamu & Meja Kopi",
    room: "Ruang Tamu",
    x: 295,
    y: 455,
    width: 146,
    height: 68,
    solid: true,
    speaker: "🛋️ Sofa Ruang Tamu",
    pages: [
      "Spot paling nyaman buat ngobrol santai, nonton film/series akhir pekan, atau main sama kucing-kucing.",
      "Kalau kamu mampir ke sini, anggap saja rumah sendiri!",
    ],
    tags: ["Cozy", "Living Room"],
  },
  {
    id: "trophy_case",
    kind: "trophy_case",
    name: "Lemari Pajangan & Pencapaian",
    room: "Ruang Tamu",
    x: 495,
    y: 372,
    width: 82,
    height: 44,
    solid: true,
    speaker: "🏆 Lemari Pajangan & Perjalanan Karier",
    pages: [
      "Menyimpan kenang-kenangan perjalanan karier: mulai dari CV Sinang Permata Group, PT. Geomatika Satelit Indonesia, hingga PT. Adidata Informatika saat ini.",
      "Setiap tempat memberikan pelajaran berharga tentang kolaborasi tim, kualitas kode, dan membangun produk yang bermanfaat.",
    ],
    tags: ["Milestones", "Career", "Achievement"],
  },
  {
    id: "phone_table",
    kind: "phone_table",
    name: "Meja Telepon & Buku Tamu (Kontak)",
    room: "Ruang Tamu",
    x: 115,
    y: 535,
    width: 72,
    height: 44,
    solid: true,
    speaker: "☎️ Kontak & Kolaborasi",
    pages: [
      "Tertarik berdiskusi, kolaborasi proyek seru, atau sekadar menyapa? Jangan ragu untuk menghubungi!",
      "(Placeholder: tambahkan link Email, LinkedIn, GitHub, dan Instagram kamu di src/data/houseData.ts.)",
    ],
    tags: ["Contact", "GitHub", "LinkedIn", "Email"],
  },
  {
    id: "plant",
    kind: "plant",
    name: "Tanaman Monstera & Pojok Hijau",
    room: "Ruang Tamu",
    x: 525,
    y: 552,
    width: 44,
    height: 44,
    solid: true,
    speaker: "🪴 Tanaman Sudut Ruang",
    pages: [
      "Sedikit sentuhan hijau di dalam rumah biar suasana tetap adem dan segar.",
      "Untungnya Gray Pi, Kimmy, dan Boba jarang iseng gigitin daunnya!",
    ],
  },

  // ==================== DAPUR & RUANG MAKAN ====================
  {
    id: "kitchen_counter",
    kind: "kitchen_counter",
    name: "Meja Dapur & Pojok Kopi",
    room: "Dapur",
    x: 700,
    y: 375,
    width: 124,
    height: 44,
    solid: true,
    speaker: "☕ Dapur & Coffee Corner",
    pages: [
      "Tempat meracik kopi atau teh hangat sebelum mulai ngoding, plus menyiapkan camilan favorit.",
      "Di sudut bawah juga ada mangkuk makan khusus buat Gray Pi, Kimmy, dan Boba.",
    ],
    tags: ["Coffee", "Snacks"],
  },
  {
    id: "fridge",
    kind: "fridge",
    name: "Kulkas Penuh Stok",
    room: "Dapur",
    x: 818,
    y: 375,
    width: 52,
    height: 50,
    solid: true,
    speaker: "🧊 Kulkas Rumah",
    pages: [
      "Isinya minuman dingin, bahan masakan, dan tentu saja stok wet food kesukaan tiga kucing di rumah ini!",
    ],
    tags: ["Treats", "Fresh"],
  },
  {
    id: "dining_table",
    kind: "dining_table",
    name: "Meja Makan Hangat",
    room: "Dapur",
    x: 745,
    y: 515,
    width: 112,
    height: 62,
    solid: true,
    speaker: "🍽️ Meja Makan",
    pages: [
      "Tempat menikmati makanan favorit sambil istirahat sejenak dari layar.",
      "(Placeholder: tulis makanan dan minuman favoritmu di sini!)",
    ],
    tags: ["Foodie", "Break Time"],
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
    speaker: "🚪 Pintu Depan",
    pages: ["Kembali keluar menuju halaman kota."],
    isExit: true,
  },
];

export const houseCats: CatData[] = [
  {
    id: "graypi",
    name: "Gray Pi",
    gender: "jantan",
    coat: "#7d8590",
    secondaryCoat: "#cbd5e1",
    earInner: "#f4afb4",
    eyeColor: "#fbbf24",
    collarColor: "#2563eb",
    homeX: 225,
    homeY: 225,
    roamRadius: 75,
    pitch: 0.88,
    meows: ["Meong~ 🐾", "Prrr... (Gray Pi)", "Miaw!"],
    pages: [
      "🐾 Gray Pi (Kucing Jantan) — Si ganteng berbulu abu-abu yang kalem tapi suka penasaran kalau Azzam lagi ngetik di meja kerja.",
      "Gray Pi paling hobi rebahan di dekat meja PC sambil dengerin suara keyboard!",
    ],
  },
  {
    id: "kimmy",
    name: "Kimmy",
    gender: "betina",
    coat: "#f8fafc",
    secondaryCoat: "#f59e0b",
    earInner: "#fda4af",
    eyeColor: "#38bdf8",
    collarColor: "#ec4899",
    homeX: 430,
    homeY: 465,
    roamRadius: 85,
    pitch: 1.18,
    meows: ["Miuw~ 💕", "Meow! (Kimmy)", "Purrr~"],
    pages: [
      "🐾 Kimmy (Kucing Betina) — Si manis yang lincah, ramah, dan paling suka nyamperin siapa pun yang duduk di sofa ruang tamu.",
      "Kalau dielus, Kimmy langsung purring kencang dan berguling manja!",
    ],
  },
  {
    id: "boba",
    name: "Boba",
    gender: "betina",
    coat: "#d6a77a",
    secondaryCoat: "#5c3a21",
    earInner: "#f9a8d4",
    eyeColor: "#4ade80",
    collarColor: "#a855f7",
    homeX: 655,
    homeY: 455,
    roamRadius: 75,
    pitch: 1.08,
    meows: ["Meow~ 🧋", "Nyaa! (Boba)", "Prrr~"],
    pages: [
      "🐾 Boba (Kucing Betina) — Warnanya manis seperti milk tea boba! Paling sigap kalau dengar suara kulkas atau mangkuk makan di dapur.",
      "Boba suka jalan-jalan santai keliling ruang hobi dan dapur sambil menggoyangkan ekornya.",
    ],
  },
];

export function isHouseBlocked(x: number, y: number): boolean {
  // Outer bounds
  if (x < 52 || x > HOUSE_WIDTH - 52 || y < 68 || y > HOUSE_HEIGHT - 44) {
    // Allow stepping onto the doormat area near the exit
    const nearExit = Math.abs(x - 460) < 42 && y >= 540 && y <= 604;
    if (!nearExit) return true;
  }

  // Interior walls
  for (const w of HOUSE_WALLS) {
    if (x > w.x - 10 && x < w.x + w.w + 10 && y > w.y - 4 && y < w.y + w.h + 10) {
      return true;
    }
  }

  // Solid furniture footprints
  for (const f of houseFurniture) {
    if (!f.solid) continue;
    const left = f.x - f.width / 2 - 8;
    const right = f.x + f.width / 2 + 8;
    const top = f.y - f.height + 8;
    const bottom = f.y + 6;
    if (x > left && x < right && y > top && y < bottom) {
      return true;
    }
  }

  return false;
}

