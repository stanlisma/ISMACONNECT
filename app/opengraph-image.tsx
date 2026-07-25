import { ImageResponse } from "next/og";

import { SITE_TAGLINE } from "@/lib/constants";

export const alt = "ISMACONNECT — Fort McMurray rides, rentals, jobs, and services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1E5FE0 0%, #0f3aa3 100%)",
          padding: "80px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            color: "#bcd2ff",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 24
          }}
        >
          Fort McMurray
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 800, color: "#ffffff", letterSpacing: -2 }}>
          ISMACONNECT
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#dbe6ff", marginTop: 32, maxWidth: 880 }}>
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size }
  );
}
