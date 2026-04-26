"use client";

import Link from "next/link";
import { useState } from "react";

import { SaveListingButton } from "@/components/listings/save-listing-button";
import { getSubcategoryLabel } from "@/lib/subcategories";
import { excerpt, formatCurrency, getCategoryHref, getCategoryLabel } from "@/lib/utils";
import type { Listing } from "@/types/database";
import { useRouter } from "next/navigation";

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  canSave?: boolean;
  pathToRevalidate?: string;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric"
  });
}

function isNewListing(dateString: string) {
  const date = new Date(dateString);
  const diffHours = (Date.now() - date.getTime()) / 36e5;
  return diffHours <= 48;
}

export function ListingCard({
  listing,
  isSaved = false,
  canSave = false,
  pathToRevalidate
}: ListingCardProps) {
  const router = useRouter();
  const images =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.image_url
        ? [listing.image_url]
        : [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const rawViews = (listing as any).views;
  const views =
    typeof rawViews === "number" && rawViews > 0
      ? rawViews
      : Math.floor(Math.random() * 28);

  const isNew = isNewListing(listing.created_at);
  const isPopular = views > 10;

  function showPreviousImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (images.length <= 1) return;

    setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (images.length <= 1) return;

    setActiveImageIndex((current) => (current + 1) % images.length);
  }

  return (
    <article
        className="listing-card listing-card-clickable"
        onClick={() => {
          router.push(`/listings/${listing.slug}`);
        }}
    >
      <div className="listing-media listing-media-gallery">
        {images.length > 0 ? (
          <Link href={`/listings/${listing.slug}`} aria-label={`View ${listing.title}`}>
            <img alt={listing.title} src={images[activeImageIndex]} loading="lazy" />

            <div className="listing-card-badges">
              {isNew ? <span className="listing-card-badge listing-card-badge-new">New</span> : null}

              {listing.is_featured ? (
                <span className="listing-card-badge listing-card-badge-featured">Featured</span>
              ) : null}
            </div>

            {images.length > 1 ? (
              <>
                <button
                  className="listing-gallery-arrow listing-gallery-arrow-left"
                  type="button"
                  onClick={showPreviousImage}
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <button
                  className="listing-gallery-arrow listing-gallery-arrow-right"
                  type="button"
                  onClick={showNextImage}
                  aria-label="Next image"
                >
                  ›
                </button>

                <span className="listing-gallery-count">
                  {activeImageIndex + 1}/{images.length}
                </span>
              </>
            ) : null}
          </Link>
        ) : (
          <Link href={`/listings/${listing.slug}`}>
            <div className="listing-placeholder">
              <span>{getCategoryLabel(listing.category)}</span>
            </div>
          </Link>
        )}
      </div>

      <div className="listing-body">
        <div
          className="badge-row"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div className="badge-row">
            <Link className="badge badge-soft" href={getCategoryHref(listing.category)}>
              {getCategoryLabel(listing.category)}
            </Link>

            {listing.subcategory ? (
              <span className="badge badge-subcategory">
                {getSubcategoryLabel(listing.category, listing.subcategory)}
              </span>
            ) : null}
          </div>

          {canSave ? (
            <div
                onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <SaveListingButton
                listingId={listing.id}
                isSaved={isSaved}
                pathToRevalidate={pathToRevalidate}
              />
            </div>
          ) : null}
        </div>

        <div className="listing-top">
          <Link href={`/listings/${listing.slug}`}>
            <h3 className="listing-title">{listing.title}</h3>
          </Link>

          <div style={{ textAlign: "right" }}>
            <span className="listing-price">{formatCurrency(listing.price)}</span>

            {isPopular && (
              <span className="listing-urgency-inline">🔥</span>
            )}
          </div>
        </div>

        <p className="listing-description">{excerpt(listing.description)}</p>

        <div className="listing-card-signals">
          <span className="listing-location">📍 {listing.location.split(",")[0]}</span>
          <span>•</span>
          <span>{formatTimeAgo(listing.created_at)}</span>

          {views > 0 ? (
            <>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{views} views</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}