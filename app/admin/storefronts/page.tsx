import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import {
  AdditionalStorefrontsManager,
  buildCreateStorefrontHref
} from "@/components/settings/additional-storefronts-manager";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireAdminViewer } from "@/lib/auth";
import {
  adminCreateUnclaimedStorefrontAction,
  deleteAdditionalStorefrontAction,
  updateAdditionalStorefrontAction
} from "@/lib/actions/settings";
import { getOwnedAdditionalStorefronts } from "@/lib/data";
import { getSingleParam } from "@/lib/utils";

const RETURN_PATH = "/admin/storefronts";

export default async function AdminStorefrontsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const viewer = await requireAdminViewer();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showCreateForm = getSingleParam(resolvedSearchParams?.create) === "1";
  const focusStorefrontId = getSingleParam(resolvedSearchParams?.storefront);
  const storefrontsResult = await getOwnedAdditionalStorefronts(viewer.user.id);

  // Only businesses seeded via this page - never the admin's own real
  // storefront(s), which happen to share the same owner_id as a technical
  // placeholder but are fully claimed and managed elsewhere (Settings).
  const unclaimedStorefronts = storefrontsResult.storefronts.filter((storefront) => !storefront.claimed);

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />

      <div className="surface" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow">Unclaimed businesses</span>
        <h2 className="section-title">Add a business you onboarded in person</h2>
        <p className="section-copy">
          Create a storefront for a business that hasn't signed up yet - name, phone, and category is enough to
          start. It goes live immediately as an "Unclaimed" listing with a call button, and you can add more detail
          (photos, hours, description) any time. The business claims it later once they sign up. This never touches
          your own storefronts - those stay in Settings.
        </p>

        <div className="action-row" style={{ marginTop: "1rem" }}>
          <Link className="button" href={buildCreateStorefrontHref(RETURN_PATH)}>
            + Add unclaimed business
          </Link>
        </div>
      </div>

      <AdditionalStorefrontsManager
        storefronts={unclaimedStorefronts}
        schemaReady={storefrontsResult.schemaReady}
        focusStorefrontId={focusStorefrontId}
        showCreateForm={showCreateForm}
        createAction={adminCreateUnclaimedStorefrontAction}
        updateAction={updateAdditionalStorefrontAction}
        deleteAction={deleteAdditionalStorefrontAction}
        returnPath={RETURN_PATH}
        sectionTitle="Unclaimed businesses"
        createLabel="Add unclaimed business"
      />
    </>
  );
}
