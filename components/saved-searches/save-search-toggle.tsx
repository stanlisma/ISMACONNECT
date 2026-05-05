import { BellRing, SearchCheck } from "lucide-react";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { toggleSavedSearchAction } from "@/lib/actions/saved-searches";
import { hasMeaningfulSavedSearchCriteria } from "@/lib/saved-searches";
import type { ListingCategory } from "@/types/database";

interface SaveSearchToggleProps {
  viewerId?: string | null;
  actionPath: string;
  returnTo: string;
  search?: string | null;
  category?: ListingCategory | null;
  subcategory?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  extraFilters?: Record<string, string | boolean>;
  isSaved: boolean;
}

export function SaveSearchToggle({
  viewerId,
  actionPath,
  returnTo,
  search,
  category,
  subcategory,
  minPrice,
  maxPrice,
  sort,
  extraFilters,
  isSaved
}: SaveSearchToggleProps) {
  const canSaveSearch = hasMeaningfulSavedSearchCriteria({
    path: actionPath,
    search,
    category,
    subcategory,
    minPrice,
    maxPrice,
    sort,
    extraFilters
  });

  if (!canSaveSearch) {
    return (
      <div className="saved-search-banner saved-search-banner-muted">
        <div className="saved-search-copy">
          <strong>Save searches</strong>
          <p>Add a keyword, category, or price filter to save alerts for this view.</p>
        </div>
      </div>
    );
  }

  if (!viewerId) {
    return (
      <div className="saved-search-banner">
        <div className="saved-search-copy">
          <strong>Save this search</strong>
          <p>Sign in to keep this search and track new matching listings in one place.</p>
        </div>

        <Link href="/auth/sign-in" className="button button-secondary">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="saved-search-banner">
      <div className="saved-search-copy">
        <strong>{isSaved ? "Search saved" : "Save this search"}</strong>
        <p>
          {isSaved
            ? "You will see new matching listings in your saved-search alerts."
            : "Keep this filter set and get a heads-up when new matching listings appear."}
        </p>
      </div>

      <form action={toggleSavedSearchAction} className="saved-search-form">
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="path" value={actionPath} />
        <input type="hidden" name="search" value={search ?? ""} />
        <input type="hidden" name="category" value={category ?? ""} />
        <input type="hidden" name="subcategory" value={subcategory ?? ""} />
        <input type="hidden" name="minPrice" value={minPrice ?? ""} />
        <input type="hidden" name="maxPrice" value={maxPrice ?? ""} />
        <input type="hidden" name="sort" value={sort ?? ""} />
        <input type="hidden" name="extraFilters" value={JSON.stringify(extraFilters ?? {})} />

        <SubmitButton
          className={isSaved ? "button-secondary saved-search-submit" : "saved-search-submit"}
          pendingLabel={isSaved ? "Updating..." : "Saving..."}
        >
          {isSaved ? (
            <>
              <SearchCheck aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>Saved</span>
            </>
          ) : (
            <>
              <BellRing aria-hidden="true" size={18} strokeWidth={2.3} />
              <span>Save search</span>
            </>
          )}
        </SubmitButton>
      </form>
    </div>
  );
}
