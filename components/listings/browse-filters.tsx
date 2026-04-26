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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const subcategories = useMemo(() => getSubcategories(selectedCategory), [selectedCategory]);

  return (
    <>
      {/* MOBILE COMPACT SEARCH */}
      <form action={actionPath} className="mobile-filter-row" method="get">
        <input
          className="input mobile-filter-search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search bikes, rentals, jobs..."
        />

        <button
          className="button mobile-filter-button"
          type="button"
          onClick={() => setIsFilterOpen(true)}
        >
          ⚙️ Filter
        </button>
      </form>

      {/* DESKTOP FULL FILTERS */}
      <form action={actionPath} className="surface filters-grid desktop-filters" method="get">
        <label className="field filter-search">
          <span className="field-label">Search</span>
          <input className="input" name="q" defaultValue={search ?? ""} placeholder="Search bikes, rentals, jobs..." />
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
          <input className="input" name="minPrice" type="number" defaultValue={minPrice ?? ""} placeholder="Min $" />
        </label>

        <label className="field">
          <span className="field-label">Max price</span>
          <input className="input" name="maxPrice" type="number" defaultValue={maxPrice ?? ""} placeholder="Max $" />
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

      {/* MOBILE FILTER SHEET */}
      {isFilterOpen ? (
        <div className="mobile-filter-backdrop" onClick={() => setIsFilterOpen(false)}>
          <div className="mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-filter-sheet-header">
              <h3>Filters</h3>
              <button type="button" onClick={() => setIsFilterOpen(false)}>
                ×
              </button>
            </div>

            <form action={actionPath} method="get" className="mobile-filter-sheet-form">
              <input type="hidden" name="q" value={search ?? ""} />

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
              ) : (
                <input type="hidden" name="category" value={category ?? ""} />
              )}

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
                <input className="input" name="minPrice" type="number" defaultValue={minPrice ?? ""} placeholder="Min $" />
              </label>

              <label className="field">
                <span className="field-label">Max price</span>
                <input className="input" name="maxPrice" type="number" defaultValue={maxPrice ?? ""} placeholder="Max $" />
              </label>

              <label className="field">
                <span className="field-label">Sort</span>
                <select className="select" name="sort" defaultValue={sort ?? ""}>
                  <option value="">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </label>

              <div className="mobile-filter-sheet-actions">
                <Link href={actionPath} className="button button-secondary">
                  Clear
                </Link>

                <button className="button" type="submit">
                  Apply filters
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}