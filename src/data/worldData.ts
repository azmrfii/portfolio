export type BuildingKind = "home" | "school" | "office" | "shop" | "hangout";
export type TownZone = "home_zone" | "edu_zone" | "work_zone";
export type VehicleType = "car" | "moto";

export type BuildingId =
  | "home"
  | "tk"
  | "sd"
  | "smp"
  | "sma"
  | "coffee"
  | "kuliah"
  | "agl"
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
  style: "home" | "school" | "campus" | "office" | "coffee" | "disco";
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
  /** Extra sprite height above the walls (awnings, rooftop props) for click bounds & hints */
  extraTop?: number;
}

export interface BuildingData {
  id: BuildingId;
  zone: TownZone;
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
  zone: TownZone;
  buildingId: BuildingId;
  name: string;
  gender: "male" | "female";
  x: number;
  y: number;
  look: CharacterLook;
  dialogue?: string[];
  /** Bob in place like they're dancing */
  dancing?: boolean;
  /** Greeting shown in the speech bubble (defaults to "Halo Azzam!") */
  greeting?: string;
}

export interface DecorItem {
  id: string;
  zone: TownZone;
  kind: "tree" | "pine" | "bush" | "rock" | "flowers" | "lamp";
  x: number;
  y: number;
}

export interface GateConfig {
  x: number;
  y: number;
  toZone: TownZone;
  label: string;
  direction: "left" | "right";
}

export interface ZoneConfig {
  id: TownZone;
  title: string;
  shortLabel: string;
  subtitle: string;
  width: number;
  height: number;
  road: { x: number; y: number }[];
  defaultSpawn: { x: number; y: number };
  spawnFromLeft?: { x: number; y: number };
  spawnFromRight?: { x: number; y: number };
  leftGate?: GateConfig;
  rightGate?: GateConfig;
  parkingSpot: { x: number; y: number };
  pond?: { x: number; y: number; rx: number; ry: number };
}

export const ROAD_Y = 350;
export const ROW_BASE = 260;
export const ROAD_WIDTH = 42;
export const PLAYER_SPEED = 155;
export const CAMERA_LERP = 0.12;
export const INTERACT_DISTANCE = 82;
export const NPC_GREET_DISTANCE = 90;

/** Oblique projection used for building side faces & roofs */
export const OBLIQUE = { x: 0.55, y: 0.42 };

export const PLAYER_START = { x: 180, y: ROAD_Y };

export const PLAYER_LOOK: CharacterLook = {
  skin: "#f6cfa8",
  hair: "#3b2618",
  hairStyle: "short",
  shirt: "#2f8f6b",
  pants: "#2c3e63",
  shoes: "#4a2f22",
};

export const TOWN_ZONES: Record<TownZone, ZoneConfig> = {
  home_zone: {
    id: "home_zone",
    title: "🏠 Map 1: Area Rumah & Nongkrong",
    shortLabel: "🏠 Rumah & AGL",
    subtitle: "Rumah Azzam, Garasi Kendaraan, Stand Kopi & Diskotik AGL",
    width: 960,
    height: 540,
    road: [
      { x: 90, y: ROAD_Y },
      { x: 930, y: ROAD_Y },
    ],
    defaultSpawn: { x: 180, y: ROAD_Y },
    spawnFromRight: { x: 820, y: ROAD_Y },
    parkingSpot: { x: 365, y: 265 },
    rightGate: {
      x: 900,
      y: ROAD_Y,
      toZone: "edu_zone",
      label: "Ke Kawasan Pendidikan 🎓",
      direction: "right",
    },
  },
  edu_zone: {
    id: "edu_zone",
    title: "🎓 Map 2: Kawasan Pendidikan",
    shortLabel: "🎓 Pendidikan",
    subtitle: "TK Ar Rofa, SD Fathan Mubina, SMP Roudlotul Jannah, SMK & Universitas Telkom",
    width: 1220,
    height: 540,
    road: [
      { x: 30, y: ROAD_Y },
      { x: 1190, y: ROAD_Y },
    ],
    defaultSpawn: { x: 190, y: ROAD_Y },
    spawnFromLeft: { x: 135, y: ROAD_Y },
    spawnFromRight: { x: 1085, y: ROAD_Y },
    parkingSpot: { x: 190, y: 445 },
    leftGate: {
      x: 65,
      y: ROAD_Y,
      toZone: "home_zone",
      label: "Ke Rumah & AGL 🏠",
      direction: "left",
    },
    rightGate: {
      x: 1155,
      y: ROAD_Y,
      toZone: "work_zone",
      label: "Ke Kawasan Kantor 💼",
      direction: "right",
    },
  },
  work_zone: {
    id: "work_zone",
    title: "💼 Map 3: Kawasan Pekerjaan",
    shortLabel: "💼 Pekerjaan",
    subtitle: "CV Sinang Permata Group, PT. Geomatika Satelit Indonesia & PT. Adidata Informatika",
    width: 1020,
    height: 560,
    road: [
      { x: 30, y: ROAD_Y },
      { x: 910, y: ROAD_Y },
    ],
    defaultSpawn: { x: 260, y: ROAD_Y },
    spawnFromLeft: { x: 140, y: ROAD_Y },
    parkingSpot: { x: 220, y: 445 },
    pond: { x: 580, y: 465, rx: 68, ry: 44 },
    leftGate: {
      x: 65,
      y: ROAD_Y,
      toZone: "edu_zone",
      label: "Ke Kawasan Pendidikan 🎓",
      direction: "left",
    },
  },
};

export const ZONE_ORDER: TownZone[] = ["home_zone", "edu_zone", "work_zone"];

export const buildings: BuildingData[] = [
  // ==================== MAP 1: HOME & HANGOUT ====================
  {
    id: "home",
    zone: "home_zone",
    kind: "home",
    name: "Rumah",
    shortLabel: "Rumah",
    signLines: ["Azzam's Home"],
    x: 180,
    y: ROW_BASE,
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
        "Jelajahi jalan kota: dekati bangunan lalu tekan E, atau naik mobil/motor ke kawasan Pendidikan & Pekerjaan.",
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
    id: "coffee",
    zone: "home_zone",
    kind: "shop",
    name: "Stand Kopi",
    shortLabel: "Kopi ☕",
    signLines: ["Ngopi dulu"],
    x: 540,
    y: ROW_BASE,
    visual: {
      style: "coffee",
      width: 72,
      wallHeight: 30,
      depth: 34,
      roofHeight: 0,
      floors: 1,
      wallColor: "#8b5a2b",
      roofColor: "#b91c1c",
      trimColor: "#5c3a1b",
      windowColor: "#fde68a",
      doorColor: "#3b2a1a",
      extraTop: 36,
    },
    modal: {
      title: "Stand Kopi — Ngopi Dulu",
      subtitle: "Bahan bakar sebelum berangkat",
      paragraphs: [
        "(Placeholder) Mampir bentar sebelum berangkat naik mobil/motor. Ceritain kopi favoritmu di sini — misalnya es kopi susu gula aren, americano, atau manual brew.",
      ],
      bullets: ["Menu favorit: (isi nanti)", "Tempat ngopi langganan: (isi nanti)"],
      tags: ["Coffee", "Ngopi"],
    },
  },
  {
    id: "agl",
    zone: "home_zone",
    kind: "hangout",
    name: "AGL",
    shortLabel: "AGL",
    signLines: ["Teman Rumah"],
    x: 740,
    y: ROW_BASE,
    visual: {
      style: "disco",
      width: 116,
      wallHeight: 78,
      depth: 58,
      roofHeight: 0,
      floors: 1,
      wallColor: "#2a1f3d",
      roofColor: "#1c1530",
      trimColor: "#ec4899",
      windowColor: "#a855f7",
      doorColor: "#0f0a1a",
      extraTop: 24,
    },
    modal: {
      title: "AGL — Teman Rumah",
      subtitle: "Tempat nongkrong bareng teman-teman rumah 🪩",
      paragraphs: [
        "Markas teman-teman rumah — tempat ngumpul, ketawa, dan cerita sampai lupa waktu.",
      ],
      bullets: ["Barista: Dymas", "DJ: Valdy", "Crew: Rafly, Noval, Kaila, Syifa, Aliyah"],
      tags: ["Friends", "Hangout", "AGL"],
    },
  },

  // ==================== MAP 2: EDUCATION ====================
  {
    id: "tk",
    zone: "edu_zone",
    kind: "school",
    name: "TK Ar Rofa",
    shortLabel: "TK",
    signLines: ["Ar Rofa"],
    x: 190,
    y: ROW_BASE,
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
      paragraphs: [
        "Fyi dulu pas TK sempet 3x pindah karena ku ga tau mau ngapain, sehari sekolah langsung nanya kapan libur? xixi",
      ],
      bullets: ["Bocil sewajarnya"],
      tags: ["Kebanyakan main"],
    },
  },
  {
    id: "sd",
    zone: "edu_zone",
    kind: "school",
    name: "MI Fathan Mubina",
    shortLabel: "SD",
    signLines: ["Fathan Mubina"],
    x: 390,
    y: ROW_BASE,
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
      paragraphs: [
        "Sebenernya pindah ke sini pas kelas 2, karena bokap kerja di daerah bogor, bocil SD yang pendek akhirnya mendapatkan banyak teman walau tidak bisa mendapatkan ranking pertama sebagai laki-laki di SD ini (ranking 2 terus hufttt).",
      ],
      bullets: [
        "OSN MTK (Harapan dua tingkat kecamatan, kabupaten? ya gagal lah wong belajar sendiri dibuku ga diajari wkwk)",
        "MTK dan Mendapatkan Uang adalah hal yang menyenangkan",
      ],
      tags: ["Pondasi ilmu"],
    },
  },
  {
    id: "smp",
    zone: "edu_zone",
    kind: "school",
    name: "SMPIT Roudlotul Jannah",
    shortLabel: "SMP",
    signLines: ["Roudlotul Jannah"],
    x: 590,
    y: ROW_BASE,
    visual: {
      style: "school",
      width: 118,
      wallHeight: 62,
      depth: 62,
      roofHeight: 32,
      floors: 1,
      wallColor: "#eef2f9",
      roofColor: "#2563eb",
      trimColor: "#1d4ed8",
      windowColor: "#c4e4ff",
      doorColor: "#1e3a8a",
    },
    modal: {
      title: "SMP — Eksplorasi Minat",
      subtitle: "Mulai kenal teknologi & organisasi",
      paragraphs: [
        "Masa SMP jadi titik awal ketertarikan pada komputer, desain, dan kegiatan ekstrakurikuler.",
        "Mulai sering ngulik hal-hal baru bareng teman.",
      ],
      bullets: ["Aktif kegiatan sekolah", "Mulai suka dunia digital", "Belajar kerja tim"],
      tags: ["Eksplorasi", "Organisasi"],
    },
  },
  {
    id: "sma",
    zone: "edu_zone",
    kind: "school",
    name: "SMK Wikrama Garut & Farmako Medika Plus",
    shortLabel: "SMK",
    signLines: ["Wikrama Garut (Thn 1)", "Farmako Medika Plus (Thn 2–3)"],
    x: 800,
    y: ROW_BASE,
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
      paragraphs: [
        "Boarding cuman setaun (tapi punya temen yang seru disana), terus pindah deh ke SMK yang gatau ini sekolah apaan, eh ternyata temen-nya pada seru, sefrekuensi, baik-baik, gurunya juga seruu, eh tiba-tiba ketemu crush juga karena sempet ngeliat dia salim ke bokapnya saat di anterin sekolah (jadi inget pas kecil sering gitu), and then i'm falling in love with her..",
      ],
      bullets: [
        "Lomba MTK Peraih medali Emas (Nasional - Daring) - WK Garut",
        "Lomba MTK Peraih medali Perak (Nasional - Daring) - WK Garut",
        "Lomba MTK Peraih medali Perunggu (Nasional - Daring) - WK Garut",
        "Persiapan kuliah IT",
        "Pendiri eskul Basket - FMK",
        "Juara kelas dari semester 4 s.d Lulus - FMK",
      ],
      tags: ["Pertemanan", "Fokus"],
    },
  },
  {
    id: "kuliah",
    zone: "edu_zone",
    kind: "school",
    name: "Universitas Telkom",
    shortLabel: "Kuliah",
    signLines: ["Universitas Telkom"],
    x: 1030,
    y: ROW_BASE,
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
      bullets: [
        "Kuliah Online",
        "RAM beberapa matkul karena sudah kerja",
        "Aku mencintaimu LMS saat menjelang UAS",
      ],
      tags: ["Engineering", "Informatika"],
    },
  },

  // ==================== MAP 3: WORK / OFFICES ====================
  {
    id: "office1",
    zone: "work_zone",
    kind: "office",
    name: "CV Sinang Permata Group",
    shortLabel: "Office 1",
    signLines: ["CV Sinang Permata Group"],
    x: 260,
    y: ROW_BASE,
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
      bullets: [
        "CMS Development: Built and managed a custom CMS for company profiles to streamline content management efficiency",
        "UI/UX Implementation: Translated Figma designs into responsive and interactive frontend code following industry standards",
        "Performance Optimization: Enhanced website functionality and speed by implementing clean code and web best practices",
      ],
      tags: ["Laravel", "Github", "PHP", "MySQL", "JavaScript", "Trello", "CSS"],
    },
  },
  {
    id: "office2",
    zone: "work_zone",
    kind: "office",
    name: "PT. Geomatika Satelit Indonesia",
    shortLabel: "Office 2",
    signLines: ["PT. Geomatika Satelit", "Indonesia"],
    x: 520,
    y: ROW_BASE,
    visual: {
      style: "office",
      width: 100,
      wallHeight: 88,
      depth: 56,
      roofHeight: 0,
      floors: 3,
      wallColor: "#d9cfc1",
      roofColor: "#8c7f70",
      trimColor: "#6b5d4d",
      windowColor: "#82c5ea",
      doorColor: "#3f352b",
    },
    modal: {
      title: "Pengalaman Kerja — Fulltime",
      subtitle: "IT Developer — Mei 2023 s.d Sept. 2025",
      paragraphs: [
        "Awal masuk karena diajak senior saat di SMK dulu untuk bantu dia di perusahaan ini, saat beliau resign ku menggantikan posisi beliau dan menjadi kartap di tahun 2024 bulan Februari.",
      ],
      bullets: [
        "Full-Stack Web & GIS Development: Engineered and maintained high-performance web applications, including WebGIS and Custom CMS, using Python, Golang, and Laravel",
        "Cross-Platform Mobile Development: Designed and deployed mobile applications to the Google Play Store using Flutter, managing the full lifecycle from UI implementation to production release",
        "API Architecture & Integration: Developed scalable RESTful APIs and integrated complex spatial data to support real-time geolocation features and seamless front-end-to-back-end communication",
        "Database & System Optimization: Managed MySQL databases and server configurations via cPanel, ensuring high availability, data integrity, and optimized query performance",
        "End-to-End Project Execution: Collaborated in Agile environments using Trello and GitHub while utilizing Canva for rapid UI prototyping and visual asset creation",
      ],
      tags: [
        "Laravel",
        "Flutter",
        "Golang",
        "Python",
        "REST APIs",
        "MySQL",
        "jQuery",
        "JavaScript",
        "Google Play Console",
        "cPanel",
        "Canva",
        "Trello",
        "GitHub",
        "Node.js",
      ],
    },
  },
  {
    id: "office3",
    zone: "work_zone",
    kind: "office",
    name: "PT. Adidata Informatika",
    shortLabel: "Office 3",
    signLines: ["PT. Adidata Informatika", "★ Saat ini"],
    x: 780,
    y: ROW_BASE,
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
      paragraphs: [
        "Masuk ke dunia IT consultant, yang mana beda project bisa beda bahasa pemograman.. ketemu rekan kerjaa yang seru poll dan baik walau beberapa udah beda perusahaan.",
      ],
      bullets: [
        "Fullstack Web Development: Developing enterprise web applications for PT SMI, including IOSS, ECMS (Laravel REST API & Livewire), and SMI Berbagi (React TypeScript & Laravel), focusing on automated workflows, business logic, and responsive UI",
        "Performance & Scaling: Optimizing system performance using Redis for caching and Apache Kafka for robust event-driven messaging across microservices",
        "Infrastructure & DevOps: Managing containerized environments with Docker and utilizing advanced Queue management to ensure high-speed data synchronization",
        "Agile Collaboration: Maintaining technical stability, shipping bug fixes, and driving disciplined SDLC execution across client deliverables using Git and Jira",
      ],
      tags: [
        "AWS",
        "Jira",
        "Microsoft Azure",
        "Docker",
        "Agile",
        "Cursor AI",
        "Claude",
        "Vibe Coder",
        "Laravel",
        "Livewire",
        "React TS",
        "Redis",
        "Gitlab",
        "Microservices",
        "REST APIs",
        "SQL Server",
        "MySQL",
        "Apache Kafka",
      ],
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

const COFFEE_CUSTOMER: CharacterLook = {
  skin: "#f6cfa8",
  hair: "#3b2618",
  hairStyle: "bob",
  shirt: "#f59e0b",
  pants: "#334155",
  shoes: "#3b2a1a",
};

export const npcs: NpcData[] = buildings
  .filter((b) => b.kind !== "home" && b.id !== "agl")
  .flatMap((b): NpcData[] => {
    if (b.id === "coffee") {
      return [
        {
          id: "coffee-customer",
          zone: b.zone,
          buildingId: b.id,
          name: "Pelanggan",
          gender: "female",
          x: b.x - b.visual.width / 2 - 14,
          y: b.y + 20,
          look: COFFEE_CUSTOMER,
          greeting: "Kopinya enak! ☕",
        },
      ];
    }
    const [mName, fName] = npcNames[b.id];
    const [mLook, fLook] = npcLooks[b.id];
    const offset = b.visual.width / 2 + 14;
    return [
      {
        id: `${b.id}-m`,
        zone: b.zone,
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
        zone: b.zone,
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
  // ==================== HOME ZONE DECOR ====================
  { id: "h_t1", zone: "home_zone", kind: "pine", x: 65, y: 120 },
  { id: "h_t2", zone: "home_zone", kind: "tree", x: 300, y: 115 },
  { id: "h_t3", zone: "home_zone", kind: "pine", x: 460, y: 110 },
  { id: "h_t4", zone: "home_zone", kind: "tree", x: 640, y: 115 },
  { id: "h_t5", zone: "home_zone", kind: "pine", x: 885, y: 120 },
  { id: "h_t6", zone: "home_zone", kind: "tree", x: 140, y: 485 },
  { id: "h_t7", zone: "home_zone", kind: "pine", x: 380, y: 490 },
  { id: "h_t8", zone: "home_zone", kind: "tree", x: 650, y: 485 },
  { id: "h_t9", zone: "home_zone", kind: "pine", x: 860, y: 490 },
  { id: "h_b1", zone: "home_zone", kind: "bush", x: 85, y: 290 },
  { id: "h_b2", zone: "home_zone", kind: "bush", x: 260, y: 440 },
  { id: "h_b3", zone: "home_zone", kind: "bush", x: 520, y: 445 },
  { id: "h_f1", zone: "home_zone", kind: "flowers", x: 270, y: 295 },
  { id: "h_f2", zone: "home_zone", kind: "flowers", x: 625, y: 295 },
  { id: "h_f3", zone: "home_zone", kind: "flowers", x: 460, y: 435 },
  { id: "h_l1", zone: "home_zone", kind: "lamp", x: 280, y: 315 },
  { id: "h_l2", zone: "home_zone", kind: "lamp", x: 465, y: 315 },
  { id: "h_l3", zone: "home_zone", kind: "lamp", x: 635, y: 315 },
  { id: "h_l4", zone: "home_zone", kind: "lamp", x: 845, y: 315 },

  // ==================== EDU ZONE DECOR ====================
  { id: "e_t1", zone: "edu_zone", kind: "tree", x: 80, y: 115 },
  { id: "e_t2", zone: "edu_zone", kind: "pine", x: 290, y: 110 },
  { id: "e_t3", zone: "edu_zone", kind: "tree", x: 490, y: 115 },
  { id: "e_t4", zone: "edu_zone", kind: "pine", x: 695, y: 110 },
  { id: "e_t5", zone: "edu_zone", kind: "tree", x: 915, y: 115 },
  { id: "e_t6", zone: "edu_zone", kind: "pine", x: 1150, y: 115 },
  { id: "e_t7", zone: "edu_zone", kind: "pine", x: 110, y: 490 },
  { id: "e_t8", zone: "edu_zone", kind: "tree", x: 350, y: 485 },
  { id: "e_t9", zone: "edu_zone", kind: "pine", x: 590, y: 490 },
  { id: "e_t10", zone: "edu_zone", kind: "tree", x: 830, y: 485 },
  { id: "e_t11", zone: "edu_zone", kind: "pine", x: 1080, y: 490 },
  { id: "e_f1", zone: "edu_zone", kind: "flowers", x: 290, y: 295 },
  { id: "e_f2", zone: "edu_zone", kind: "flowers", x: 490, y: 295 },
  { id: "e_f3", zone: "edu_zone", kind: "flowers", x: 700, y: 295 },
  { id: "e_f4", zone: "edu_zone", kind: "flowers", x: 470, y: 435 },
  { id: "e_f5", zone: "edu_zone", kind: "flowers", x: 720, y: 435 },
  { id: "e_b1", zone: "edu_zone", kind: "bush", x: 940, y: 440 },
  { id: "e_l1", zone: "edu_zone", kind: "lamp", x: 290, y: 315 },
  { id: "e_l2", zone: "edu_zone", kind: "lamp", x: 490, y: 315 },
  { id: "e_l3", zone: "edu_zone", kind: "lamp", x: 695, y: 315 },
  { id: "e_l4", zone: "edu_zone", kind: "lamp", x: 915, y: 315 },

  // ==================== WORK ZONE DECOR ====================
  { id: "w_t1", zone: "work_zone", kind: "pine", x: 95, y: 115 },
  { id: "w_t2", zone: "work_zone", kind: "tree", x: 390, y: 115 },
  { id: "w_t3", zone: "work_zone", kind: "pine", x: 650, y: 110 },
  { id: "w_t4", zone: "work_zone", kind: "tree", x: 925, y: 120 },
  { id: "w_t5", zone: "work_zone", kind: "pine", x: 100, y: 500 },
  { id: "w_t6", zone: "work_zone", kind: "tree", x: 370, y: 495 },
  { id: "w_t7", zone: "work_zone", kind: "pine", x: 780, y: 495 },
  { id: "w_t8", zone: "work_zone", kind: "tree", x: 930, y: 490 },
  { id: "w_f1", zone: "work_zone", kind: "flowers", x: 390, y: 295 },
  { id: "w_f2", zone: "work_zone", kind: "flowers", x: 650, y: 295 },
  { id: "w_f3", zone: "work_zone", kind: "flowers", x: 450, y: 445 },
  { id: "w_r1", zone: "work_zone", kind: "rock", x: 700, y: 465 },
  { id: "w_l1", zone: "work_zone", kind: "lamp", x: 150, y: 315 },
  { id: "w_l2", zone: "work_zone", kind: "lamp", x: 390, y: 315 },
  { id: "w_l3", zone: "work_zone", kind: "lamp", x: 650, y: 315 },
  { id: "w_l4", zone: "work_zone", kind: "lamp", x: 900, y: 315 },
];

export function getZoneBuildings(zone: TownZone): BuildingData[] {
  return buildings.filter((b) => b.zone === zone);
}

export function getZoneNpcs(zone: TownZone): NpcData[] {
  return npcs.filter((n) => n.zone === zone);
}

export function getZoneDecor(zone: TownZone): DecorItem[] {
  return decor.filter((d) => d.zone === zone);
}

/** Screen-space-independent bounds of a building sprite (for clicks / culling) */
export function getBuildingBounds(b: BuildingData) {
  const v = b.visual;
  const dx = v.depth * OBLIQUE.x;
  const dy = v.depth * OBLIQUE.y;
  return {
    left: b.x - v.width / 2 - 8,
    right: b.x + v.width / 2 + dx + 8,
    top: b.y - v.wallHeight - v.roofHeight - dy - 16 - (v.extraTop ?? 0),
    bottom: b.y + 12,
  };
}

  function insideBuildingFootprint(zone: TownZone, x: number, y: number): boolean {
    for (const b of buildings) {
      if (b.zone !== zone) continue;
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

    function inWater(zone: TownZone, x: number, y: number): boolean {
      const pond = TOWN_ZONES[zone].pond;
      if (!pond) return false;
      const nx = (x - pond.x) / (pond.rx + 4);
      const ny = (y - pond.y) / (pond.ry + 4);
      return nx * nx + ny * ny < 1;
    }

      export function isBlockedInZone(zone: TownZone, x: number, y: number): boolean {
        const cfg = TOWN_ZONES[zone];
        if (x < 22 || y < 32 || x > cfg.width - 22 || y > cfg.height - 14) return true;
        return insideBuildingFootprint(zone, x, y) || inWater(zone, x, y);
      }

        export function findNearestBuildingInZone(
          zone: TownZone,
          playerX: number,
          playerY: number,
          maxDistance = INTERACT_DISTANCE,
        ): BuildingData | null {
        let best: BuildingData | null = null;
        let bestDist = maxDistance;
        for (const b of buildings) {
          if (b.zone !== zone) continue;
          const dist = Math.hypot(playerX - b.x, playerY - (b.y + 14));
          const limit = Math.max(maxDistance, b.visual.width * 0.75);
          if (dist < limit && dist < bestDist) {
            best = b;
            bestDist = dist;
          }
        }
        return best;
      }

      export function findNearestGate(
        zone: TownZone,
        playerX: number,
        playerY: number,
        maxDist = 68,
      ): GateConfig | null {
        const cfg = TOWN_ZONES[zone];
        const gates = [cfg.leftGate, cfg.rightGate].filter((g): g is GateConfig => !!g);
        for (const g of gates) {
          if (Math.hypot(playerX - g.x, playerY - g.y) <= maxDist) {
            return g;
          }
        }
        return null;
      }

      export function isNearParking(zone: TownZone, playerX: number, playerY: number): boolean {
        const p = TOWN_ZONES[zone].parkingSpot;
        return Math.hypot(playerX - p.x, playerY - p.y) <= 64;
      }
