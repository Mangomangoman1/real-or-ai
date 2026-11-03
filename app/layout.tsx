import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "./globals.css";

const description = "A daily game: five pairs of photos, one real and one AI in each. Can you spot the slop?";
const title = "Sloppity · real or AI?";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: "%s · Sloppity" },
  description,
  applicationName: "Sloppity",
  openGraph: { type: "website", siteName: "Sloppity", title, description, url: "/" },
  twitter: { card: "summary_large_image", title, description },
  appleWebApp: { title: "Sloppity", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  robots: process.env.VERCEL_ENV === "production" ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe9dd" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a09" },
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
