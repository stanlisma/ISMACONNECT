import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ISMACONNECT",
    short_name: "ISMA",
    description: "Fort McMurray local marketplace for rentals, ride shares, jobs, services, and buy & sell.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#f5f9ff",
    theme_color: "#1E5FE0",
    lang: "en-CA",
    categories: ["shopping", "business", "productivity"],
    shortcuts: [
      {
        name: "Browse Listings",
        short_name: "Browse",
        url: "/browse"
      },
      {
        name: "Create Listing",
        short_name: "Post",
        url: "/dashboard/listings/new"
      },
      {
        name: "Saved Searches",
        short_name: "Alerts",
        url: "/dashboard/searches"
      },
      {
        name: "Camp Rides",
        short_name: "Rides",
        url: "/categories/ride-share?subcategory=camp-site-transport&view=map"
      },
      {
        name: "Local Businesses",
        short_name: "Businesses",
        url: "/businesses"
      }
    ],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
