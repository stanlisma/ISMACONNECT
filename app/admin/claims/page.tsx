import Link from "next/link";

import { ClaimActions } from "@/components/admin/claim-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireAdminViewer } from "@/lib/auth";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import { getPendingStorefrontClaims } from "@/lib/data";
import { formatDate, getSingleParam } from "@/lib/utils";

export default async function AdminClaimsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminViewer();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const claims = await getPendingStorefrontClaims();

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="surface" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow">Business claims</span>
        <h2 className="section-title">Review claim requests</h2>
        <p className="section-copy">
          Approving a claim transfers the unclaimed business (and any listings posted under it) to the
          claimant&apos;s account.
        </p>
      </div>

      {claims.length === 0 ? (
        <EmptyState
          title="No pending claims"
          description="Claim requests on unclaimed businesses will appear here for review."
        />
      ) : (
        <div className="dashboard-list">
          {claims.map((claim) => (
            <div className="dashboard-listing" key={claim.id}>
              <div className="badge-row">
                <span className="badge badge-soft">Business claim</span>
                <span className="badge badge-neutral">Pending</span>
              </div>

              <h3>{claim.storefront?.name ?? "Unknown business"}</h3>
              <p>
                Claimed by {claim.claimant?.full_name || claim.claimant?.email || "Unknown user"} · Submitted{" "}
                {formatDate(claim.created_at)}
              </p>

              <div className="meta-list">
                {claim.claimant?.email ? <span>Email: {claim.claimant.email}</span> : null}
                {claim.message ? <span>Verification note: {claim.message}</span> : null}
              </div>

              <div className="action-row" style={{ justifyContent: "space-between" }}>
                {claim.storefront ? (
                  <Link
                    className="button button-ghost"
                    href={buildStorefrontHref(claim.storefront.owner_id, claim.storefront.id)}
                  >
                    View business page
                  </Link>
                ) : null}

                <ClaimActions claimId={claim.id} businessName={claim.storefront?.name ?? "this business"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
