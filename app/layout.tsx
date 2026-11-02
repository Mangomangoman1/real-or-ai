import type { Metadata, Viewport } from "next";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Real or AI · a daily eye test",
  description: "Five pairs a day. One photo is real, its twin was made by AI. Can you tell?",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2eee5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d0c" },
  ],
};

// Apply a saved theme before paint so there is no flash.
const themeScript = `try{var s=JSON.parse(localStorage.getItem("real-or-ai:v1")||"{}");if(s.theme)document.documentElement.dataset.theme=s.theme}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* Rough edge for the rubber stamps */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="2.6" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
