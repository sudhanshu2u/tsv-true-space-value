import type { Metadata } from "next";
import { Playfair_Display, Work_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "TSV · True Space Value — India's Apartment Rating Platform",
  description:
    "Score any residential apartment on 13 dimensions: space efficiency, sunlight, ventilation, vastu, view, and city-normalised value. Upload a floor plan and get your TSV score instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${workSans.variable}`}>
      <body className="min-h-screen bg-sand bg-grain antialiased">{children}</body>
    </html>
  );
}
