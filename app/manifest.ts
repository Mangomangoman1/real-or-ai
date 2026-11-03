import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sloppity",
    short_name: "Sloppity",
    description: "Real or AI? A daily game. Five pairs, one AI fake in each.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
