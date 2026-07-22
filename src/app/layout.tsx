import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Press_Start_2P } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Retro arcade display font, reserved for HUD chrome (headings, labels). */
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

/** Sleek sci-fi display font for the brand title and big headings. */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  weight: ["600", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pokédex",
    template: "%s | Pokédex",
  },
  description:
    "Pokédex construida con Next.js (App Router), TypeScript y Tailwind CSS sobre PokéAPI: filtros por tipo y generación, y búsqueda por nombre y cadena evolutiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // The neon HUD experience is dark-only: the `.dark` class is permanent
      // so every legacy `dark:` utility stays active without a toggle.
      className={`dark ${geistSans.variable} ${geistMono.variable} ${pressStart.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-slate-100">
        <NuqsAdapter>
          <Header />
          {children}
        </NuqsAdapter>
      </body>
    </html>
  );
}
