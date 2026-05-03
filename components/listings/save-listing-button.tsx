import { Heart } from "lucide-react";

import { toggleSavedListingAction } from "@/lib/actions/saved-listings";

interface SaveListingButtonProps {
  listingId: string;
  isSaved: boolean;
  pathToRevalidate?: string;
}

export function SaveListingButton({
  listingId,
  isSaved,
  pathToRevalidate
}: SaveListingButtonProps) {
  const action = toggleSavedListingAction.bind(null, listingId, pathToRevalidate);

  return (
    <form action={action}>
      <button
        type="submit"
        className="save-listing-button"
        aria-label={isSaved ? "Remove from favourites" : "Add to favourites"}
        title={isSaved ? "Remove from favourites" : "Add to favourites"}
      >
        <Heart
          size={20}
          strokeWidth={2.2}
          fill={isSaved ? "currentColor" : "none"}
        />
      </button>
    </form>
  );
}
