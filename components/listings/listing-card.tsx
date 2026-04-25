"use client";

import Link from "next/link";
import { useState } from "react";

import { SaveListingButton } from "@/components/listings/save-listing-button";
import { getSubcategoryLabel } from "@/lib/subcategories";
import { excerpt, formatCurrency, formatDate, getCategoryHref, getCategoryLabel } from "@/lib/utils";
import type { Listing } from "@/types/database";

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  canSave?: boolean;
  pathToRevalidate?: string;
}

export function ListingCard({
  listing,
  isSaved = false,
  canSave = false,
  pathToRevalidate
}: ListingCardProps) {
  const images =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.image_url
        ? [listing.image_url]
        : [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  function showPreviousImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setActiveImageIndex((current) => (current + 1) % images.length);
  }

  return (
    <article className="listing-card">
      <div className="listing-media listing-media-gallery">
        {images.length > 0 ? (
          <Link href={`/listings/${listing.slug}`} aria-label={`View ${listing.title}`}>
            <img alt={listing.title} src={images[activeImageIndex]} />

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

            {listing.is_featured ? <span className="badge badge-featured">Featured</span> : null}
          </div>

          {canSave ? (
            <SaveListingButton
              listingId={listing.id}
              isSaved={isSaved}
              pathToRevalidate={pathToRevalidate}
            />
          ) : null}
        </div>

        <div className="listing-top">
          <Link href={`/listings/${listing.slug}`}>
            <h3 className="listing-title">{listing.title}</h3>
          </Link>
          <span className="listing-price">{formatCurrency(listing.price)}</span>
        </div>

        <p className="listing-description">{excerpt(listing.description)}</p>

        <div className="listing-meta">
          <span>{listing.location}</span>
          <span>{formatDate(listing.created_at)}</span>
        </div>
      </div>
    </article>
  );
}