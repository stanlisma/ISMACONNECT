"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import { getSubcategories } from "@/lib/subcategories";
import type { ListingCategory } from "@/types/database";

interface BrowseFiltersProps {
  actionPath: string;
  search?: string;
  category?: ListingCategory;
  subcategory?: string | null;
  showCategorySelect?: boolean;
}

export function BrowseFilters({
  actionPath,
  search,
  category,
  subcategory,
  showCategorySelect = true
}: BrowseFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategory ?? "");

  const subcategories = useMemo(
    () => getSubcategories(selectedCategory),
    [selectedCategory]
  );

  return (
    <form action={actionPath} className="surface filters-grid" method="get">
      {/* SEARCH */}
      <label className="field">
        <span className="field-label">Search listings</span>
        <input
          className="input"
          defaultValue={search}
          name="q"
          placeholder="Search by title, keywords, or neighbourhood"
        />
      </label>

      {/* CATEGORY */}
      {showCategorySelect ? (
        <label className="field">
          <span className="field-label">Category</span>
          <select
            className="select"
            name="category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory(""); // reset subcategory when category changes
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {/* SUBCATEGORY */}
      {subcategories.length > 0 ? (
        <label className="field">
          <span className="field-label">Sub-category</span>
          <select
            className="select"
            name="subcategory"
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
          >
            <option value="">All sub-categories</option>
            {subcategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {/* ACTIONS */}
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