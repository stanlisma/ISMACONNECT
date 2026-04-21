import Link from "next/link";

import { CATEGORIES } from "@/lib/constants";
import type { ListingCategory } from "@/types/database";

interface BrowseFiltersProps {
  actionPath: string;
  search?: string;
  category?: ListingCategory;
  showCategorySelect?: boolean;
}

export function BrowseFilters({
  actionPath,
  search,
  category,
  showCategorySelect = true
}: BrowseFiltersProps) {
  return (
    <form action={actionPath} className="surface filters-grid" method="get">
      <label className="field">
        <span className="field-label">Search listings</span>
        <input
          className="input"
          defaultValue={search}
          name="q"
          placeholder="Search by title, keywords, or neighbourhood"
        />
      </label>

      {showCategorySelect ? (
        <label className="field">
          <span className="field-label">Category</span>
          <select className="select" defaultValue={category ?? ""} name="category">
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="filter-actions">
        <button className="button" type="submit">
          Apply filters
        </button>
        <Link className="button button-secondary" href={actionPath}>
          Clear
        </Link>
      </div>
    </form>
  );
}

