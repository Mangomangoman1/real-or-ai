import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

const description = "Five pairs a day. In each, one photo is real and its twin was made by AI. Can you spot the fake?";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Real or AI · a daily eye test", template: "%s · Real or AI" },
  description,
  applicationName: "Real or AI",
  openGraph: { type: "website", siteName: "Real or AI", title: "Real or AI · a daily eye test", description, url: "/" },
  twitter: { card: "summary_large_image", title: "Real or AI · a daily eye test", description },
  appleWebApp: { title: "Real or AI", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: process.env.VERCEL_ENV === "production" ? { index: true, follow: true } : { index: false, follow: false },
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
        <Analytics />
      </body>
    </html>
  );
}
