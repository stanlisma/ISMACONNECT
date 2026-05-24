"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SaveListingButton } from "@/components/listings/save-listing-button";
import { TrustBadges } from "@/components/trust/trust-badges";
import { getListingBoostState } from "@/lib/boost-products";
import { LISTING_INTENT_LABELS, REQUEST_WINDOW_LABELS } from "@/lib/constants";
import { getListingFreshness } from "@/lib/listing-freshness";
import { getStructuredCardHighlights } from "@/lib/listing-structured-fields";
import { getPublicListingImages } from "@/lib/listing-media";
import { getPublicListingLocationLabel } from "@/lib/local-marketplace";
import { getSubcategoryLabel } from "@/lib/subcategories";
import { getSellerReviewBadgeLabel } from "@/lib/trust-presentation";
import { excerpt, formatListingPrice, getCategoryLabel } from "@/lib/utils";
import type { Listing, SellerTrustSummary } from "@/types/database";

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  canSave?: boolean;
  pathToRevalidate?: string;
  trustSummary?: SellerTrustSummary | null;
  matchHints?: string[];
}

export function ListingCard({
  listing,
  isSaved = false,
  canSave = false,
  pathToRevalidate,
  trustSummary,
  matchHints = []
}: ListingCardProps) {
  const router = useRouter();

  const images = getPublicListingImages(listing);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [freshness, setFreshness] = useState(() => getListingFreshness(listing.created_at));
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const suppressNextClick = useRef(false);

  useEffect(() => {
    setFreshness(getListingFreshness(listing.created_at));
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

  const publicLocation = getPublicListingLocationLabel(listing);
  const listingIntent = listing.listing_intent === "need" ? "need" : "offer";
  const isNeed = listingIntent === "need";
  const requestWindowLabel = listing.request_window ? REQUEST_WINDOW_LABELS[listing.request_window] : null;
  const structuredHighlights = getStructuredCardHighlights(listing.category, listing.structured_data);
  const mobileTrustLabel =
    trustSummary?.verification_status === "verified"
      ? "ID verified"
      : getSellerReviewBadgeLabel(trustSummary, true);

  const isNew = freshness.isNew;
  const timeAgo = freshness.timeLabel;
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
              decoding="async"
              sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw"
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

            {urgentActive ? (
              <span className="mobile-marketplace-badge">Urgent</span>
            ) : null}

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
              <span className="mobile-marketplace-price">
                {formatListingPrice(listing.price, listing.price_type, listingIntent)}
              </span>
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

      <div className="mobile-marketplace-meta">
        <div className="mobile-marketplace-meta-row">
          {isNeed ? (
            <span className="mobile-marketplace-chip">{LISTING_INTENT_LABELS[listingIntent]}</span>
          ) : null}
          {listing.subcategory ? (
            <span className="mobile-marketplace-chip">
              {getSubcategoryLabel(listing.category, listing.subcategory)}
            </span>
          ) : null}
        </div>

        <div className="mobile-marketplace-meta-row mobile-marketplace-meta-row-soft">
          <span>{publicLocation}</span>
          <span aria-hidden="true">|</span>
          <span>{timeAgo}</span>
          {mobileTrustLabel ? (
            <>
              <span aria-hidden="true">|</span>
              <span>{mobileTrustLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="listing-body">
        <div
          className="badge-row"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div className="badge-row">
            {isNeed ? (
              <span className="badge badge-soft">
                {LISTING_INTENT_LABELS[listingIntent]}
              </span>
            ) : null}
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
              {formatListingPrice(listing.price, listing.price_type, listingIntent)}
            </span>
            {isNeed && requestWindowLabel ? (
              <div className="listing-request-window">{requestWindowLabel}</div>
            ) : null}
          </div>
        </div>

        <p className="listing-description">{excerpt(listing.description)}</p>

        {structuredHighlights.length ? (
          <div className="listing-card-signals listing-card-structured-signals">
            {structuredHighlights.map((item, index) => (
              <span key={item}>
                {index > 0 ? <span style={{ opacity: 0.5 }}>|</span> : null} {item}
              </span>
            ))}
          </div>
        ) : null}

        {matchHints.length ? (
          <div className="listing-match-hints">
            <span className="listing-match-badge">Schedule match</span>
            {matchHints.map((hint) => (
              <span key={hint} className="listing-match-hint">
                {hint}
              </span>
            ))}
          </div>
        ) : null}

        <TrustBadges summary={trustSummary} compact />

        <div className="listing-card-signals">
          <span className="listing-location">{publicLocation}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </article>
  );
}
