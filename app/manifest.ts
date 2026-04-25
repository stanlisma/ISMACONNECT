import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ISMACONNECT",
    short_name: "ISMACONNECT",
    description: "Fort McMurray local marketplace for rentals, ride shares, jobs, services, and buy & sell.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5faff",
    theme_color: "#15365b",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}