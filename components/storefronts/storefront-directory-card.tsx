import Link from "next/link";
import { ExternalLink, MapPin, Phone } from "lucide-react";

import { TrustBadges } from "@/components/trust/trust-badges";
import { VerifiedNameBadge } from "@/components/trust/verified-name-badge";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import { excerpt } from "@/lib/utils";
import type { PublicBusinessStorefrontDirectoryItem, SellerTrustSummary } from "@/types/database";

export function StorefrontDirectoryCard({
  storefront,
  trustSummary
}: {
  storefront: PublicBusinessStorefrontDirectoryItem;
  trustSummary?: SellerTrustSummary | null;
}) {
  const storefrontInitial = storefront.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <article className="surface storefront-directory-card">
      <div className="storefront-directory-card-head">
        <div className="storefront-directory-brand">
          <div className="storefront-directory-avatar" aria-hidden="true">
            {storefront.logo_url ? (
              <img src={storefront.logo_url} alt="" className="storefront-directory-avatar-image" />
            ) : (
              storefrontInitial
            )}
          </div>

          <div className="storefront-directory-copy">
            <span className="eyebrow">Local storefront</span>
            <h3 className="verified-name-inline">
              <span>{storefront.name}</span>
              <VerifiedNameBadge summary={trustSummary} compact />
            </h3>
            <p>
              {storefront.description
                ? excerpt(storefront.description, 110)
                : "Local business storefront on ISMACONNECT."}
            </p>
          </div>
        </div>

        <TrustBadges summary={trustSummary} compact showVerifiedBadge={false} />
      </div>

      <div className="storefront-directory-meta">
        <span>
          <MapPin aria-hidden="true" size={14} strokeWidth={2.1} />
          <span>{storefront.primary_location}</span>
        </span>
      </div>

      {storefront.image_urls.length ? (
        <div className="storefront-directory-cover">
          <img src={storefront.image_urls[0]} alt="" className="storefront-directory-cover-image" />
        </div>
      ) : null}

      {storefront.services.length ? (
        <div className="storefront-directory-chip-row">
          {storefront.services.slice(0, 3).map((service) => (
            <span key={service} className="seller-storefront-specialty-chip">
              {service}
            </span>
          ))}
        </div>
      ) : null}

      {storefront.service_areas.length ? (
        <p className="storefront-directory-areas">
          Serves {storefront.service_areas.slice(0, 3).join(", ")}
        </p>
      ) : null}

      <div className="storefront-directory-actions">
        <Link href={buildStorefrontHref(storefront.owner_id, storefront.storefront_id)} className="button">
          Open storefront
        </Link>
        {storefront.website ? (
          <a href={storefront.website} target="_blank" rel="noreferrer" className="button button-secondary">
            <span>Website</span>
            <ExternalLink aria-hidden="true" size={14} strokeWidth={2.1} />
          </a>
        ) : storefront.phone ? (
          <a href={`tel:${storefront.phone}`} className="button button-secondary">
            <Phone aria-hidden="true" size={14} strokeWidth={2.1} />
            <span>Call</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
