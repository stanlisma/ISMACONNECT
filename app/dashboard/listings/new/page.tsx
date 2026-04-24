import { ListingForm } from "@/components/listings/listing-form";
import { FlashMessage } from "@/components/ui/flash-message";
import { createListingAction } from "@/lib/actions/listings";
import { getSingleParam } from "@/lib/utils";

export default async function NewListingPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <>
      <FlashMessage message={getSingleParam(resolvedSearchParams?.error)} tone="error" />
      <FlashMessage message={getSingleParam(resolvedSearchParams?.success)} tone="success" />

      <div className="surface" style={{ marginBottom: "1rem" }}>
        <h2>Create a new listing</h2>
        <p className="section-copy">
          Add the details buyers, renters, applicants, or neighbours need to respond quickly.
        </p>
      </div>

      <ListingForm action={createListingAction} submitLabel="Publish listing" />
    </>
  );
}