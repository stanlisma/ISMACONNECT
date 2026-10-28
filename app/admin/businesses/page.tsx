import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { AdminBusinessActions } from "@/components/admin/admin-business-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireAdminViewer } from "@/lib/auth";
import { buildStorefrontHref } from "@/lib/business-storefronts";
import { getAllBusinessesForAdmin } from "@/lib/data";
import { buildPathWithQuery, formatDate, getSingleParam } from "@/lib/utils";

export default async function AdminBusinessesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  await requireAdminViewer();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = getSingleParam(resolvedSearchParams?.q);
  const { businesses, totalCount, error } = await getAllBusinessesForAdmin(search);
  const returnPath = buildPathWithQuery("/admin/businesses", { q: search });
  const duplicateCount = businesses.filter((business) => business.sameNameCount > 0).length;

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error) ?? error ?? undefined} tone="error" />

      <div className="surface" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow">All businesses</span>
        <h2 className="section-title">Suspend or delete a business profile</h2>
        <p className="section-copy">
          Every business profile on the site, claimed or not. Profiles with the same name sit together and are
          flagged, so a business that registered more than once is easy to spot. Suspending hides a profile
          until you restore it; deleting removes it permanently. Neither touches the owner's account.
        </p>

        <form method="get" className="action-row" style={{ marginTop: "1rem" }}>
          <input
            className="input"
            type="text"
            name="q"
            placeholder="Search by business name, phone, owner or email"
            defaultValue={search ?? ""}
          />
          <button className="button button-secondary" type="submit">
            Search
          </button>
          {search ? (
            <Link className="button button-ghost" href="/admin/businesses">
              Clear
            </Link>
          ) : null}
        </form>

        <p className="section-copy" style={{ marginTop: "0.75rem" }}>
          {search ? `${businesses.length} of ${totalCount}` : totalCount} business profile
          {totalCount === 1 ? "" : "s"}
          {duplicateCount > 0 ? ` · ${duplicateCount} share a name with another profile` : ""}
        </p>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          title="No businesses found"
          description={search ? "No business profiles match that search." : "No business profiles exist yet."}
        />
      ) : (
        <div className="dashboard-list">
          {businesses.map((business) => (
            <div className="dashboard-listing" key={business.id}>
              <div className="badge-row">
                <span className="badge badge-soft">{business.claimed ? "Claimed" : "Unclaimed"}</span>
                {business.founding_member ? <span className="badge badge-soft">Founding member</span> : null}
                {!business.is_active ? <span className="badge badge-danger">Suspended</span> : null}
                {business.owner?.suspended_at ? <span className="badge badge-danger">Owner suspended</span> : null}
                {business.sameNameCount > 0 ? (
                  <span className="badge badge-featured">
                    {business.sameNameCount} other profile{business.sameNameCount === 1 ? "" : "s"} with this name
                  </span>
                ) : null}
                {business.sameOwnerCount > 0 ? (
                  <span className="badge badge-neutral">
                    {business.sameOwnerCount} other profile{business.sameOwnerCount === 1 ? "" : "s"} on this account
                  </span>
                ) : null}
              </div>

              <h3>{business.name}</h3>
              <p>
                {business.owner?.full_name || "Unnamed member"} · {business.owner?.email || "No email on file"}
                {business.phone ? ` · ${business.phone}` : ""}
              </p>
              <p>
                Created {formatDate(business.created_at)} · {business.activeListingCount} active listing
                {business.activeListingCount === 1 ? "" : "s"}
                {business.is_active ? (
                  <>
                    {" · "}
                    <Link href={buildStorefrontHref(business.owner_id, business.id)}>View profile</Link>
                  </>
                ) : null}
              </p>

              <AdminBusinessActions
                storefrontId={business.id}
                name={business.name}
                isActive={business.is_active}
                activeListingCount={business.activeListingCount}
                returnPath={returnPath}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
