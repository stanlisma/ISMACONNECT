"use client";

import { useState } from "react";

interface ListingImageGalleryProps {
  title: string;
  categoryLabel: string;
  images: string[];
}

export function ListingImageGallery({
  title,
  categoryLabel,
  images
}: ListingImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  if (images.length === 0) {
    return (
      <div className="listing-placeholder">
        <span>{categoryLabel}</span>
      </div>
    );
  }

  return (
    <div className="listing-detail-gallery">
      <img
        src={images[activeImage]}
        alt={`${title} image ${activeImage + 1}`}
        className="listing-detail-main-image"
      />

      {images.length > 1 ? (
        <div className="listing-detail-thumbnails">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              className={
                index === activeImage
                  ? "listing-detail-thumb is-active"
                  : "listing-detail-thumb"
              }
              onClick={() => setActiveImage(index)}
              aria-label={`View image ${index + 1}`}
            >
              <img src={url} alt={`${title} thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}