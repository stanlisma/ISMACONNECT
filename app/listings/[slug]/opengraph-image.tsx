import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/constants";
import { getPublicListingBySlug } from "@/lib/data";
import { formatListingPrice } from "@/lib/utils";

export const alt = "ISMACONNECT listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getPublicListingBySlug(slug);

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1E5FE0 0%, #0f3aa3 100%)",
            color: "#ffffff",
            fontSize: 80,
            fontWeight: 800
          }}
        >
          {SITE_NAME}
        </div>
      ),
      { ...size }
    );
  }

  const price = formatListingPrice(listing.price, listing.price_type, listing.listing_intent);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #1E5FE0 0%, #0f3aa3 100%)"
        }}
      >
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#bcd2ff", letterSpacing: 2 }}>
          {SITE_NAME.toUpperCase()} · {listing.location}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            marginTop: 20,
            lineHeight: 1.15,
            maxWidth: 1000
          }}
        >
          {listing.title}
        </div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#8fd18f", marginTop: 28 }}>
          {price}
        </div>
      </div>
    ),
    { ...size }
  );
}
