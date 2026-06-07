type StorefrontImageGalleryProps = {
  images: string[];
  title: string;
  compact?: boolean;
};

function normalizeImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}

export function StorefrontImageGallery({
  images,
  title,
  compact = false
}: StorefrontImageGalleryProps) {
  const normalizedImages = normalizeImages(images);

  if (!normalizedImages.length) {
    return null;
  }

  if (compact) {
    const visibleImages = normalizedImages.slice(0, 4);
    const hiddenCount = Math.max(0, normalizedImages.length - visibleImages.length);

    return (
      <div className="storefront-photo-gallery storefront-photo-gallery-compact">
        <div className="storefront-photo-gallery-strip">
          {visibleImages.map((image, index) => (
            <a
              key={image}
              href={image}
              target="_blank"
              rel="noreferrer"
              className="storefront-photo-gallery-thumb"
              aria-label={`${title} photo ${index + 1}`}
            >
              <img src={image} alt="" />
            </a>
          ))}
          {hiddenCount ? (
            <span className="storefront-photo-gallery-more">+{hiddenCount} more</span>
          ) : null}
        </div>
      </div>
    );
  }

  const visibleImages = normalizedImages.slice(0, 4);
  const hiddenCount = Math.max(0, normalizedImages.length - visibleImages.length);

  return (
    <div className="storefront-photo-gallery">
      <div className="storefront-photo-gallery-grid">
        {visibleImages.map((image, index) => {
          const showOverflow = hiddenCount > 0 && index === visibleImages.length - 1;

          return (
            <a
              key={image}
              href={image}
              target="_blank"
              rel="noreferrer"
              className={`storefront-photo-gallery-frame${index === 0 && visibleImages.length > 1 ? " is-primary" : ""}`}
              aria-label={`${title} photo ${index + 1}`}
            >
              <img src={image} alt="" />
              {showOverflow ? (
                <span className="storefront-photo-gallery-overlay">+{hiddenCount} more</span>
              ) : null}
            </a>
          );
        })}
      </div>
    </div>
  );
}
