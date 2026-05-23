"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

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

        <div className="image-lightbox-stage">
          <img
            src={images[activeIndex]}
            alt={`${title} image ${activeIndex + 1}`}
            className="image-lightbox-image"
            decoding="async"
          />

          {canPaginate ? (
            <>
              <button
                type="button"
                className="image-lightbox-arrow image-lightbox-arrow-left"
                onClick={() => setActiveIndex((current) => (current - 1 + images.length) % images.length)}
                aria-label="Previous image"
              >
                <ChevronLeft aria-hidden="true" size={22} strokeWidth={2.5} />
              </button>

              <button
                type="button"
                className="image-lightbox-arrow image-lightbox-arrow-right"
                onClick={() => setActiveIndex((current) => (current + 1) % images.length)}
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
