"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import {
  getStructuredFilterDefinitions,
  serializeStructuredFilterValue
} from "@/lib/listing-structured-fields";
import { getSubcategories } from "@/lib/subcategories";

export function BrowseFilters({
  actionPath,
  search,
  category,
  subcategory,
  minPrice,
  maxPrice,
  sort,
  structuredFilters,
  showCategorySelect = true
}: any) {
  const [searchText, setSearchText] = useState(search ?? "");
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategory ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const subcategories = useMemo(() => getSubcategories(selectedCategory), [selectedCategory]);
  const activeStructuredCategory = (showCategorySelect ? selectedCategory : category) ?? "";
  const structuredFilterDefinitions = useMemo(
    () => getStructuredFilterDefinitions(activeStructuredCategory as any),
    [activeStructuredCategory]
  );

  function renderStructuredFilterFields() {
    if (!structuredFilterDefinitions.length) {
      return null;
    }

    return (
      <>
        {structuredFilterDefinitions.map((field) => {
          const defaultValue = serializeStructuredFilterValue(structuredFilters?.[field.name]);

          if (field.kind === "checkbox") {
            return (
              <label key={field.name} className="field">
                <span className="field-label">{field.label}</span>
                <select className="select" name={field.name} defaultValue={defaultValue}>
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            );
          }

          return (
            <label key={field.name} className="field">
              <span className="field-label">{field.label}</span>
              <select className="select" name={field.name} defaultValue={defaultValue}>
                <option value="">Any</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* MOBILE COMPACT SEARCH */}
      <form action={actionPath} className="mobile-filter-row" method="get">
        {category ? <input name="category" type="hidden" value={category} /> : null}
        {subcategory ? <input name="subcategory" type="hidden" value={subcategory} /> : null}
        {minPrice ? <input name="minPrice" type="hidden" value={minPrice} /> : null}
        {maxPrice ? <input name="maxPrice" type="hidden" value={maxPrice} /> : null}
        {sort ? <input name="sort" type="hidden" value={sort} /> : null}
        {Object.entries((structuredFilters ?? {}) as Record<string, string | boolean>).map(([key, value]) => (
          <input key={key} name={key} type="hidden" value={serializeStructuredFilterValue(value)} />
        ))}

        <input
          className="input mobile-filter-search"
          name="q"
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search bikes, rentals, jobs..."
          value={searchText}
        />

        <button
          aria-expanded={isFilterOpen}
          aria-haspopup="dialog"
          className="button mobile-filter-button"
          type="button"
          onClick={() => setIsFilterOpen(true)}
        >
          Filter
        </button>
      </form>

      {/* DESKTOP FULL FILTERS */}
      <form action={actionPath} className="surface filters-grid desktop-filters" method="get">
        <label className="field filter-search">
          <span className="field-label">Search</span>
          <input
            className="input"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Search bikes, rentals, jobs..."
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

        <div className="browse-structured-filters" key={activeStructuredCategory}>
          {renderStructuredFilterFields()}
        </div>

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
              <button aria-label="Close filters" type="button" onClick={() => setIsFilterOpen(false)}>
                X
              </button>
            </div>

            <form action={actionPath} method="get" className="mobile-filter-sheet-form">
              <input type="hidden" name="q" value={searchText} />

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

              <div className="browse-structured-filters" key={`${activeStructuredCategory}-mobile`}>
                {renderStructuredFilterFields()}
              </div>

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
