import Link from "next/link";

import { getCategoryHref, getCategoryLabel, excerpt, formatCurrency, formatDate } from "@/lib/utils";
import type { Listing } from "@/types/database";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="listing-card">
      <Link href={`/listings/${listing.slug}`}>
        <div className="listing-media">
          {listing.image_url ? (
            <img alt={listing.title} src={listing.image_url} />
          ) : (
            <div className="listing-placeholder">
              <span>{getCategoryLabel(listing.category)}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="listing-body">
        <div className="badge-row">
          <Link className="badge badge-soft" href={getCategoryHref(listing.category)}>
            {getCategoryLabel(listing.category)}
          </Link>
          {listing.is_featured ? <span className="badge badge-featured">Featured</span> : null}
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

