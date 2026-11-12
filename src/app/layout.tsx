import type { Metadata } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";
import "./globals.css";

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
  title: "Azzam Rafi Zafran — Interactive Town Portfolio",
  description:
    "Portfolio interaktif Azzam Rafi Zafran — jelajahi perjalanan pendidikan, pengalaman kerja di dunia IT, hobi, dan rumah virtual bergaya pixel game.",
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
