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

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  function openGallery(index = 0) {
    setActiveImageIndex(index);
    setIsGalleryOpen(true);
  }

  function closeGallery() {
    setIsGalleryOpen(false);
  }

  function showPreviousImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setActiveImageIndex((current) => (current + 1) % images.length);
  }

  return (
    <>
      <article className="listing-card">
        <div className="listing-media">
          {images.length > 0 ? (
            <button
              type="button"
              onClick={() => openGallery(0)}
              style={{
                border: 0,
                padding: 0,
                background: "transparent",
                width: "100%",
                height: "100%",
                cursor: "pointer",
                position: "relative"
              }}
              aria-label={`View images for ${listing.title}`}
            >
              <img alt={listing.title} src={images[0]} />

              {images.length > 1 ? (
                <span
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    bottom: "0.75rem",
                    background: "rgba(0,0,0,0.68)",
                    color: "#fff",
                    borderRadius: "999px",
                    padding: "0.25rem 0.6rem",
                    fontSize: "0.75rem",
                    fontWeight: 700
                  }}
                >
                  {images.length} photos
                </span>
              ) : null}
            </button>
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

      {isGalleryOpen && images.length > 0 ? (
        <div className="image-modal" onClick={closeGallery} role="presentation">
          <button
            type="button"
            onClick={closeGallery}
            aria-label="Close gallery"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              zIndex: 10000,
              border: 0,
              borderRadius: "999px",
              width: "40px",
              height: "40px",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer"
            }}
          >
            ×
          </button>

          <img
            src={images[activeImageIndex]}
            alt={`${listing.title} image ${activeImageIndex + 1}`}
            className="image-modal-img"
            onClick={(event) => event.stopPropagation()}
          />

          {images.length > 1 ? (
            <>
              <button className="nav prev" type="button" onClick={showPreviousImage}>
                ‹
              </button>
              <button className="nav next" type="button" onClick={showNextImage}>
                ›
              </button>

              <div
                style={{
                  position: "absolute",
                  bottom: "1.25rem",
                  color: "#fff",
                  fontWeight: 700
                }}
              >
                {activeImageIndex + 1} / {images.length}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}