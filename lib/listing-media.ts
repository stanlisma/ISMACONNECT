import type { Listing } from "@/types/database";

const BLOCKED_PUBLIC_IMAGE_HOSTS = [
  "images.unsplash.com",
  "unsplash.com"
];

function getHostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isBlockedPublicListingImage(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const hostname = getHostname(value);

  return BLOCKED_PUBLIC_IMAGE_HOSTS.some((blockedHost) =>
    hostname === blockedHost || hostname.endsWith(`.${blockedHost}`)
  );
}

export function getPublicListingImages(listing: Pick<Listing, "image_url" | "image_urls">) {
  const rawImages =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : listing.image_url
        ? [listing.image_url]
        : [];

  return rawImages.filter((imageUrl) => !isBlockedPublicListingImage(imageUrl));
}
