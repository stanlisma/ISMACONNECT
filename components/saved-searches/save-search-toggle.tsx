import { BellRing, SearchCheck } from "lucide-react";
import Link from "next/link";

import { FieldHelp } from "@/components/ui/field-help";
import { SubmitButton } from "@/components/ui/submit-button";
import { toggleSavedSearchAction } from "@/lib/actions/saved-searches";
import { hasMeaningfulSavedSearchCriteria } from "@/lib/saved-searches";
import type { ListingCategory } from "@/types/database";

interface SaveSearchToggleProps {
  viewerId?: string | null;
  actionPath: string;
  returnTo: string;
  anchorId?: string;
  search?: string | null;
  category?: ListingCategory | null;
  subcategory?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  extraFilters?: Record<string, string | boolean>;
  isSaved: boolean;
  compactOnMobile?: boolean;
}

export function SaveSearchToggle({
  viewerId,
  actionPath,
  returnTo,
  anchorId,
  search,
  category,
  subcategory,
  minPrice,
  maxPrice,
  sort,
  extraFilters,
  isSaved,
  compactOnMobile = false
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

  const helpText = !canSaveSearch
    ? "Add a keyword, category, price, or local filter before saving this search."
    : !viewerId
      ? "Sign in to save this ride-share, rental, service, job, or storefront search and get alerts when new matches appear."
      : isSaved
        ? "This search is already saved. New matching listings will show up in your saved-search alerts."
        : "Save this filter set to get alerts when new matching listings appear.";

  if (!canSaveSearch) {
    return (
      <div
        id={anchorId}
        className={`saved-search-inline${compactOnMobile ? " saved-search-inline-compact-mobile" : ""}`}
      >
        <div className="saved-search-inline-actions">
          <button type="button" className="button button-secondary saved-search-submit" disabled>
            <BellRing aria-hidden="true" size={18} strokeWidth={2.3} />
            <span>Save search</span>
          </button>

          <span className="saved-search-inline-help">
            <FieldHelp text={helpText} label="Save search" />
          </span>
        </div>
      </div>
    );
  }

  if (!viewerId) {
    return (
      <div
        id={anchorId}
        className={`saved-search-inline${compactOnMobile ? " saved-search-inline-compact-mobile" : ""}`}
      >
        <div className="saved-search-inline-actions">
          <Link href="/auth/sign-in" className="button button-secondary saved-search-submit">
            <BellRing aria-hidden="true" size={18} strokeWidth={2.3} />
            <span>Save search</span>
          </Link>

          <span className="saved-search-inline-help">
            <FieldHelp text={helpText} label="Save search" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={anchorId}
      className={`saved-search-inline${compactOnMobile ? " saved-search-inline-compact-mobile" : ""}`}
    >
      <div className="saved-search-inline-actions">
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
            analyticsEvent={isSaved ? "saved_search_remove_click" : "saved_search_save_click"}
            analyticsParams={{
              path: actionPath,
              category: category ?? "all",
              has_query: Boolean(search?.trim())
            }}
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

        <span className="saved-search-inline-help">
          <FieldHelp text={helpText} label="Save search" />
        </span>
      </div>
    </div>
  );
}
