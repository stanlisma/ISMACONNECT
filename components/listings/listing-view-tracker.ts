"use client";

import { useEffect } from "react";

export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    fetch("/api/listing-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ listingId })
    }).catch(() => {});
  }, [listingId]);

  return null;
}