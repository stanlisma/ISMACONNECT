import { unstable_noStore as noStore } from "next/cache";

import { AdditionalStorefrontsManager } from "@/components/settings/additional-storefronts-manager";
import { FlashMessage } from "@/components/ui/flash-message";
import { requireAdminViewer } from "@/lib/auth";
import {
  adminCreateUnclaimedStorefrontAction,
  deleteAdditionalStorefrontAction,
  updateAdditionalStorefrontAction
} from "@/lib/actions/settings";
import { getOwnedAdditionalStorefronts } from "@/lib/data";
import { getSingleParam } from "@/lib/utils";

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
          (photos, hours, description) any time. The business claims it later once they sign up.
        </p>
      </div>

      <AdditionalStorefrontsManager
        storefronts={storefrontsResult.storefronts}
        schemaReady={storefrontsResult.schemaReady}
        focusStorefrontId={focusStorefrontId}
        showCreateForm={showCreateForm || storefrontsResult.storefronts.length === 0}
        createAction={adminCreateUnclaimedStorefrontAction}
        updateAction={updateAdditionalStorefrontAction}
        deleteAction={deleteAdditionalStorefrontAction}
        returnPath="/admin/storefronts"
      />
    </>
  );
}
