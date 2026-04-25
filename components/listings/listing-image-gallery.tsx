"use client";

import { useRef, useState } from "react";

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
  const touchStartX = useRef(0);

  function showPreviousImage() {
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage() {
    setActiveImage((current) => (current + 1) % images.length);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLImageElement>) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLImageElement>) {
    if (images.length <= 1) return;

    const touchEndX = event.changedTouches[0].clientX;
    const difference = touchStartX.current - touchEndX;

    if (difference > 50) {
      showNextImage();
    }

    if (difference < -50) {
      showPreviousImage();
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="listing-placeholder">
        <span>{categoryLabel}</span>
      </div>
    );
  }

  return (
    <div className="listing-detail-gallery">
      <div style={{ position: "relative" }}>
        <img
          src={images[activeImage]}
          alt={`${title} image ${activeImage + 1}`}
          className="listing-detail-main-image"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="listing-detail-arrow listing-detail-arrow-left"
              onClick={showPreviousImage}
              aria-label="Previous image"
            >
              ‹
            </button>

            <button
              type="button"
              className="listing-detail-arrow listing-detail-arrow-right"
              onClick={showNextImage}
              aria-label="Next image"
            >
              ›
            </button>

            <span className="listing-detail-count">
              {activeImage + 1}/{images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <>
          <div className="image-dots">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === activeImage ? "dot active" : "dot"}
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>

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
        </>
      ) : null}
    </div>
  );
}