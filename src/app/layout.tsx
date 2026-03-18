import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shield TX — Shielded Perp Execution on Hyperliquid",
  description:
    "Your edge is leaking. 12+ copy-trading tools broadcast your positions in real-time. Shield TX stops the bleed. Powered by Hyperliquid.",
  openGraph: {
    title: "Shield TX — Your edge is leaking.",
    description:
      "12+ copy-trading tools broadcast your positions in real-time. See your exposure. Shield your trades.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shield TX — Your edge is leaking.",
    description:
      "12+ copy-trading tools broadcast your positions in real-time. See your exposure. Shield your trades.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
