"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useState } from "react";

import { buildStorefrontHref } from "@/lib/business-storefronts";
import type { BusinessMarqueeItem } from "@/types/database";

const MIN_TILES_PER_HALF = 8;

export function BusinessMarquee({ businesses }: { businesses: BusinessMarqueeItem[] }) {
  const [paused, setPaused] = useState(false);

  if (!businesses.length) {
    return null;
  }

  const innerRepeat = Math.max(1, Math.ceil(MIN_TILES_PER_HALF / businesses.length));
  const half = Array.from({ length: innerRepeat }, () => businesses).flat();
  const track = [...half, ...half];

  return (
    <section className="business-marquee surface" style={{ margin: "1.5rem 0" }}>
      <div className="business-marquee-head">
        <span className="eyebrow">Local businesses on ISMACONNECT</span>
        <button
          type="button"
          className="business-marquee-toggle"
          onClick={() => setPaused((current) => !current)}
          aria-pressed={paused}
          aria-label={paused ? "Resume business slideshow" : "Pause business slideshow"}
        >
          {paused ? (
            <Play aria-hidden="true" size={15} strokeWidth={2.2} />
          ) : (
            <Pause aria-hidden="true" size={15} strokeWidth={2.2} />
          )}
          <span>{paused ? "Resume" : "Pause"}</span>
        </button>
      </div>

      <div className="business-marquee-viewport">
        <div className={`business-marquee-track${paused ? " is-paused" : ""}`}>
          {track.map((business, index) => (
            <Link
              key={`${business.id}-${index}`}
              href={buildStorefrontHref(business.owner_id, business.id)}
              className="business-marquee-card"
            >
              <span className="business-marquee-avatar" aria-hidden="true">
                {business.logo_url ? (
                  <img src={business.logo_url} alt="" />
                ) : (
                  business.name.trim().charAt(0).toUpperCase() || "B"
                )}
              </span>
              <span className="business-marquee-name">{business.name}</span>
              {!business.claimed ? <span className="badge badge-soft">Unclaimed</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
