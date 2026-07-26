import { AdminListingStatusForm } from "@/components/admin/admin-listing-status-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireAdminViewer } from "@/lib/auth";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { getAllListingsForAdmin } from "@/lib/data";
import { formatCurrency, formatDate, getCategoryLabel, getSingleParam } from "@/lib/utils";

export default async function AdminListingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminViewer();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = getSingleParam(resolvedSearchParams?.q);
  const listings = await getAllListingsForAdmin(search);

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="surface" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow">All listings</span>
        <h2 className="section-title">Find and update any listing</h2>
        <p className="section-copy">
          Search by title and change status directly, regardless of who posted it. Removed listings are hidden
          from public view; paused listings stay hidden until resumed by their owner.
        </p>

        <form method="get" className="action-row" style={{ marginTop: "1rem" }}>
          <input
            className="input"
            type="text"
            name="q"
            placeholder="Search by listing title"
            defaultValue={search ?? ""}
          />
          <button className="button button-secondary" type="submit">
            Search
          </button>
        </form>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings found"
          description={search ? "No listings match that search." : "There are no listings yet."}
        />
      ) : (
        <div className="dashboard-list">
          {listings.map((listing) => (
            <div className="dashboard-listing" key={listing.id}>
              <div className="badge-row">
                <span className="badge badge-soft">{getCategoryLabel(listing.category)}</span>
                <span className="badge badge-neutral">{LISTING_STATUS_LABELS[listing.status as keyof typeof LISTING_STATUS_LABELS] ?? listing.status}</span>
              </div>

              <h3>{listing.title}</h3>
              <p>
                {formatCurrency(listing.price)} · {listing.location} · Updated {formatDate(listing.updated_at)}
              </p>

              <div className="meta-list">
                <span>Owner: {listing.owner?.full_name || listing.owner?.email || "Unknown"}</span>
                {listing.owner?.email ? <span>Email: {listing.owner.email}</span> : null}
              </div>

              <AdminListingStatusForm listingId={listing.id} currentStatus={listing.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
