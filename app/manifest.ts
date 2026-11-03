import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Real or AI",
    short_name: "Real or AI",
    description: "A daily eye test. Five pairs, one fake in each.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2eee5",
    theme_color: "#f2eee5",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
