"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import { getSubcategories } from "@/lib/subcategories";

export function BrowseFilters({
  actionPath,
  search,
  category,
  subcategory,
  minPrice,
  maxPrice,
  sort,
  showCategorySelect = true
}: any) {
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategory ?? "");

  const subcategories = useMemo(() => getSubcategories(selectedCategory), [selectedCategory]);

  return (
    <form action={actionPath} className="surface filters-grid" method="get">
      <label className="field filter-search">
        <span className="field-label">Search</span>
        <input
          className="input"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search listings..."
        />
      </label>

      {showCategorySelect ? (
        <label className="field">
          <span className="field-label">Category</span>
          <select
            className="select"
            name="category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {subcategories.length > 0 ? (
        <label className="field">
          <span className="field-label">Sub-category</span>
          <select
            className="select"
            name="subcategory"
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="field">
        <span className="field-label">Min price</span>
        <input
          className="input"
          name="minPrice"
          type="number"
          defaultValue={minPrice ?? ""}
          placeholder="Min $"
        />
      </label>

      <label className="field">
        <span className="field-label">Max price</span>
        <input
          className="input"
          name="maxPrice"
          type="number"
          defaultValue={maxPrice ?? ""}
          placeholder="Max $"
        />
      </label>

      <label className="field">
        <span className="field-label">Sort</span>
        <select className="select" name="sort" defaultValue={sort ?? ""}>
          <option value="">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </label>

      <div className="filter-actions">
        <button className="button" type="submit">
          Apply
        </button>

        <Link href={actionPath} className="button button-secondary">
          Clear
        </Link>
      </div>
    </form>
  );
}