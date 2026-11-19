import type { Metadata } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://azzamrafizafran.vercel.app";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700"],
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-pixel",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Azzam Rafi Zafran — Fullstack Developer | Interactive Town Portfolio",
    template: "%s | Azzam Rafi Zafran",
  },
  description:
    "Portfolio interaktif Azzam Rafi Zafran (Fullstack Developer | Web & Mobile Engineer). Jelajahi perjalanan pendidikan (Universitas Telkom, SMK Farmako Medika Plus, SMK Wikrama Garut) dan pengalaman kerja (PT. Adidata Informatika, PT. Geomatika Satelit Indonesia, CV Sinang Permata Group) dalam dunia game pixel 2D.",
  keywords: [
    "Azzam Rafi Zafran",
    "Azzam Rafi",
    "azmrfii",
    "Azzam Portfolio",
    "Azzam Rafi Zafran Portfolio",
    "Fullstack Developer Indonesia",
    "Web & Mobile Developer",
    "Software Engineer",
    "PT Adidata Informatika",
    "PT Geomatika Satelit Indonesia",
    "CV Sinang Permata Group",
    "Universitas Telkom",
    "SMK Farmako Medika Plus",
    "SMK Wikrama Garut",
    "Interactive Town Portfolio",
  ],
  authors: [{ name: "Azzam Rafi Zafran", url: SITE_URL }],
  creator: "Azzam Rafi Zafran",
  publisher: "Azzam Rafi Zafran",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Azzam Rafi Zafran's Interactive Portfolio",
    title: "Azzam Rafi Zafran — Fullstack Developer | Interactive Town Portfolio",
    description:
      "Jelajahi kota virtual interaktif Azzam Rafi Zafran: pengalaman kerja Fullstack Developer, riwayat pendidikan, hobi, dan karya digital.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Azzam Rafi Zafran — Fullstack Developer | Interactive Town Portfolio",
    description:
      "Jelajahi kota virtual interaktif Azzam Rafi Zafran: pengalaman kerja Fullstack Developer, riwayat pendidikan, dan karya digital.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${nunito.variable} ${pressStart.variable} h-full`}>
      <body className="min-h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
