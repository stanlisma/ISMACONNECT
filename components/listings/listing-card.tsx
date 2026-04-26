"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SaveListingButton } from "@/components/listings/save-listing-button";
import { getSubcategoryLabel } from "@/lib/subcategories";
import { excerpt, formatCurrency, getCategoryHref, getCategoryLabel } from "@/lib/utils";
import type { Listing } from "@/types/database";

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

  if (diffMinutes < 60) return "New";
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

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
  const parsedViews =
    rawViews === null || rawViews === undefined || rawViews === ""
      ? 0
      : Number(rawViews);

  const views = Number.isFinite(parsedViews) && parsedViews > 0 ? parsedViews : 0;

  const isNew = isNewListing(listing.created_at);
  const isPopular = views > 10;
  const timeAgo = formatTimeAgo(listing.created_at);

  function goToListing() {
    router.push(`/listings/${listing.slug}`);
  }

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
    <article className="listing-card listing-card-clickable" onClick={goToListing}>
      <div className="listing-media listing-media-gallery">
        {images.length > 0 ? (
          <Link
            href={`/listings/${listing.slug}`}
            aria-label={`View ${listing.title}`}
            onClick={(event) => event.stopPropagation()}
          >
            <img alt={listing.title} src={images[activeImageIndex]} loading="lazy" />

            {/* Desktop badges */}
            <div className="listing-card-badges">
              {isNew ? <span className="listing-card-badge listing-card-badge-new">New</span> : null}

              {listing.is_featured ? (
                <span className="listing-card-badge listing-card-badge-featured">Featured</span>
              ) : null}
            </div>

            {/* Mobile/PWA badge */}
            <span className="mobile-marketplace-badge">
              {isNew ? "Just listed" : timeAgo}
            </span>

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

            {/* Mobile/PWA overlay */}
            <div className="mobile-marketplace-overlay">
              <span className="mobile-marketplace-price">{formatCurrency(listing.price)}</span>
              <span className="mobile-marketplace-title">{listing.title}</span>
            </div>
          </Link>
        ) : (
          <Link
            href={`/listings/${listing.slug}`}
            onClick={(event) => event.stopPropagation()}
          >
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
            <Link
              className="badge badge-soft"
              href={getCategoryHref(listing.category)}
              onClick={(event) => event.stopPropagation()}
            >
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
              onClick={(event) => {
                event.stopPropagation();
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
          <Link
            href={`/listings/${listing.slug}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="listing-title">{listing.title}</h3>
          </Link>

          <div style={{ textAlign: "right" }}>
            <span className="listing-price">
              {formatCurrency(listing.price)}
              {isPopular ? <span className="listing-urgency-inline"> 🔥</span> : null}
            </span>
          </div>
        </div>

        <p className="listing-description">{excerpt(listing.description)}</p>

        <div className="listing-card-signals">
          <span className="listing-location">📍 {listing.location.split(",")[0]}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{timeAgo}</span>

          {views > 0 ? (
            <>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{views > 0 ? `${views} views` : "New"}</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}