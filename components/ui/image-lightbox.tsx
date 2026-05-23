"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  title = "Image",
  onClose
}: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  function showPreviousImage() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    touchStartX.current = touchX;
    touchEndX.current = touchX;
    touchStartY.current = touchY;
    touchEndY.current = touchY;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    touchEndX.current = event.touches[0].clientX;
    touchEndY.current = event.touches[0].clientY;
  }

  function handleTouchEnd() {
    if (images.length <= 1) {
      return;
    }

    const horizontalDistance = touchEndX.current - touchStartX.current;
    const verticalDistance = touchEndY.current - touchStartY.current;
    const isHorizontalSwipe =
      Math.abs(horizontalDistance) > 42 &&
      Math.abs(horizontalDistance) > Math.abs(verticalDistance);

    if (!isHorizontalSwipe) {
      return;
    }

    if (horizontalDistance < 0) {
      showNextImage();
    }

    if (horizontalDistance > 0) {
      showPreviousImage();
    }
  }

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (images.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, onClose]);

  if (!images.length) {
    return null;
  }

  const canPaginate = images.length > 1;

  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image viewer`}
      onClick={onClose}
    >
      <div className="image-lightbox-shell" onClick={(event) => event.stopPropagation()}>
        <div className="image-lightbox-toolbar">
          <div className="image-lightbox-copy">
            <strong>{title}</strong>
            <span>
              {activeIndex + 1}/{images.length}
            </span>
          </div>

          <button
            type="button"
            className="image-lightbox-close"
            onClick={onClose}
            aria-label="Close image viewer"
          >
            <X aria-hidden="true" size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div
          className="image-lightbox-stage"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[activeIndex]}
            alt={`${title} image ${activeIndex + 1}`}
            className="image-lightbox-image"
            decoding="async"
            draggable={false}
          />

          {canPaginate ? (
            <>
              <button
                type="button"
                className="image-lightbox-arrow image-lightbox-arrow-left"
                onClick={showPreviousImage}
                aria-label="Previous image"
              >
                <ChevronLeft aria-hidden="true" size={22} strokeWidth={2.5} />
              </button>

              <button
                type="button"
                className="image-lightbox-arrow image-lightbox-arrow-right"
                onClick={showNextImage}
                aria-label="Next image"
              >
                <ChevronRight aria-hidden="true" size={22} strokeWidth={2.5} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
