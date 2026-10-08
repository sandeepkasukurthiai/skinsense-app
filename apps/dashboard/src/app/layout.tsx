import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

// Self-hosted brand fonts (SIL OFL, see src/fonts) — no build-time call to Google Fonts.
const display = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "../fonts/CormorantGaramond_500Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/CormorantGaramond_500Medium_Italic.ttf", weight: "500", style: "italic" },
    { path: "../fonts/CormorantGaramond_600SemiBold.ttf", weight: "600", style: "normal" },
  ],
});

const sans = localFont({
  variable: "--font-merriweather-sans",
  display: "swap",
  src: [
    { path: "../fonts/MerriweatherSans_300Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/MerriweatherSans_400Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/MerriweatherSans_500Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/MerriweatherSans_600SemiBold.ttf", weight: "600", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: { default: "The Skin Sensé — Clinic", template: "%s · The Skin Sensé" },
  description: "Clinic dashboard for The Skin Sensé, Banjara Hills",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
