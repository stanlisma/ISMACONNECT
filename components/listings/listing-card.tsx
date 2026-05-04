"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SaveListingButton } from "@/components/listings/save-listing-button";
import { TrustBadges } from "@/components/trust/trust-badges";
import { getListingBoostState } from "@/lib/boost-products";
import { getSubcategoryLabel } from "@/lib/subcategories";
import { excerpt, formatCurrency, getCategoryLabel } from "@/lib/utils";
import type { Listing, SellerTrustSummary } from "@/types/database";

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  canSave?: boolean;
  pathToRevalidate?: string;
  trustSummary?: SellerTrustSummary | null;
}

function formatStaticDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(dateString));
}

function getRelativeListingInfo(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    return { isNew: true, timeLabel: "New" };
  }

  if (diffHours < 24) {
    return { isNew: true, timeLabel: `${diffHours}h` };
  }

  if (diffDays < 7) {
    return { isNew: diffHours <= 48, timeLabel: `${diffDays}d` };
  }

  return {
    isNew: false,
    timeLabel: formatStaticDateLabel(dateString)
  };
}

export function ListingCard({
  listing,
  isSaved = false,
  canSave = false,
  pathToRevalidate,
  trustSummary
}: ListingCardProps) {
  const router = useRouter();

  const images =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.image_url
        ? [listing.image_url]
        : [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relativeInfo, setRelativeInfo] = useState(() => ({
    isNew: false,
    timeLabel: formatStaticDateLabel(listing.created_at)
  }));
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const suppressNextClick = useRef(false);

  useEffect(() => {
    setRelativeInfo(getRelativeListingInfo(listing.created_at));
  }, [listing.created_at]);

  function handleTouchStart(event: React.TouchEvent) {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    touchStartX.current = touchX;
    touchEndX.current = touchX;
    touchStartY.current = touchY;
    touchEndY.current = touchY;
    suppressNextClick.current = false;
  }

  function handleTouchMove(event: React.TouchEvent) {
    touchEndX.current = event.touches[0].clientX;
    touchEndY.current = event.touches[0].clientY;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (images.length <= 1) return;

    const target = event.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }

    const horizontalDistance = touchEndX.current - touchStartX.current;
    const verticalDistance = touchEndY.current - touchStartY.current;
    const isHorizontalSwipe =
      Math.abs(horizontalDistance) > 32 &&
      Math.abs(horizontalDistance) > Math.abs(verticalDistance);

    if (!isHorizontalSwipe) {
      return;
    }

    suppressNextClick.current = true;
    event.preventDefault();
    event.stopPropagation();

    if (horizontalDistance < 0) {
      event.preventDefault();
      setActiveImageIndex((current) => (current + 1) % images.length);
    }

    if (horizontalDistance > 0) {
      setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
    }
  }

  const rawViews = (listing as any).views;
  const parsedViews =
    rawViews === null || rawViews === undefined || rawViews === ""
      ? 0
      : Number(rawViews);
  const views = Number.isFinite(parsedViews) && parsedViews > 0 ? parsedViews : 0;

  const isNew = relativeInfo.isNew;
  const isPopular = views > 10;
  const timeAgo = relativeInfo.timeLabel;
  const { featuredActive, urgentActive } = getListingBoostState(listing);

  function goToListing(event?: React.MouseEvent<HTMLElement>) {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }

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
    <article
      className="listing-card listing-card-clickable"
      onClick={(event) => goToListing(event)}
    >
      <div
        className="listing-media listing-media-gallery"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {canSave ? (
          <div
            className="mobile-listing-save"
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

        {images.length > 0 ? (
          <div className="listing-media-frame" aria-label={`View ${listing.title}`}>
            <img
              alt={listing.title}
              className="listing-media-image"
              src={images[activeImageIndex]}
              loading="lazy"
            />

            <div className="listing-card-badges">
              {isNew ? <span className="listing-card-badge listing-card-badge-new">New</span> : null}

              {featuredActive ? (
                <span className="listing-card-badge listing-card-badge-featured">Featured</span>
              ) : null}

              {urgentActive ? (
                <span className="listing-card-badge listing-card-badge-urgent">Urgent</span>
              ) : null}
            </div>

            <span className="mobile-marketplace-badge">
              {urgentActive ? "Urgent" : isNew ? "Just listed" : timeAgo}
            </span>

            {images.length > 1 ? (
              <>
                <button
                  className="listing-gallery-arrow listing-gallery-arrow-left"
                  type="button"
                  onClick={showPreviousImage}
                  aria-label="Previous image"
                >
                  {"<"}
                </button>

                <button
                  className="listing-gallery-arrow listing-gallery-arrow-right"
                  type="button"
                  onClick={showNextImage}
                  aria-label="Next image"
                >
                  {">"}
                </button>

                <span className="listing-gallery-count">
                  {activeImageIndex + 1}/{images.length}
                </span>
              </>
            ) : null}

            <div className="mobile-marketplace-overlay">
              <span className="mobile-marketplace-price">{formatCurrency(listing.price)}</span>
              <span className="mobile-marketplace-title">{listing.title}</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="listing-placeholder">
              <span>{getCategoryLabel(listing.category)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="listing-body">
        <div
          className="badge-row"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div className="badge-row">
            {listing.subcategory ? (
              <span className="badge badge-subcategory">
                {getSubcategoryLabel(listing.category, listing.subcategory)}
              </span>
            ) : null}
          </div>

          {canSave ? (
            <div
              className="desktop-listing-save"
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
          <Link href={`/listings/${listing.slug}`}>
            <h3 className="listing-title">{listing.title}</h3>
          </Link>

          <div style={{ textAlign: "right" }}>
            <span className="listing-price">
              {formatCurrency(listing.price)}
              {isPopular ? <span className="listing-urgency-inline"> Hot</span> : null}
            </span>
          </div>
        </div>

        <p className="listing-description">{excerpt(listing.description)}</p>

        <TrustBadges summary={trustSummary} compact />

        <div className="listing-card-signals">
          <span className="listing-location">{listing.location.split(",")[0]}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{timeAgo}</span>

          {views > 0 ? (
            <>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>{views > 0 ? `${views} views` : "New"}</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
