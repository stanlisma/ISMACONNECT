"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trackMarketplaceEvent } from "@/lib/analytics";
import { CATEGORIES } from "@/lib/constants";
import {
  getStructuredFilterDefinitions,
  serializeStructuredFilterValue
} from "@/lib/listing-structured-fields";
import { getCommunityMapAreaDefinition } from "@/lib/local-marketplace";
import { getSubcategories, normalizeSubcategory } from "@/lib/subcategories";
import { buildPathWithQuery } from "@/lib/utils";

export function BrowseFilters({
  actionPath,
  search,
  category,
  intent,
  requestWindow,
  communityArea,
  subcategory,
  minPrice,
  maxPrice,
  sort,
  structuredFilters,
  view,
  showCategorySelect = true
}: any) {
  const [searchText, setSearchText] = useState(search ?? "");
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedIntent, setSelectedIntent] = useState(intent ?? "");
  const [selectedRequestWindow, setSelectedRequestWindow] = useState(requestWindow ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    normalizeSubcategory(category ?? "", subcategory ?? "") ?? ""
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const subcategories = useMemo(() => getSubcategories(selectedCategory), [selectedCategory]);
  const activeStructuredCategory = (showCategorySelect ? selectedCategory : category) ?? "";
  const structuredFilterDefinitions = useMemo(
    () => getStructuredFilterDefinitions(activeStructuredCategory as any),
    [activeStructuredCategory]
  );
  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const appliedCategory = showCategorySelect ? category : null;
    const appliedSubcategories = getSubcategories(category ?? selectedCategory);

    if (showCategorySelect && appliedCategory) {
      const categoryLabel = CATEGORIES.find((item) => item.value === appliedCategory)?.label;
      if (categoryLabel) {
        labels.push(categoryLabel);
      }
    }

    const activeIntent = intent === "need" || intent === "offer" ? intent : null;
    const intentLabel =
      activeIntent === "need" ? "Need" : activeIntent === "offer" ? "Offer" : null;
    if (intentLabel) {
      labels.push(activeIntent === "need" ? "Needs only" : "Offers only");
    }

    const activeRequestWindow =
      requestWindow === "today" || requestWindow === "this-week" || requestWindow === "flexible"
        ? requestWindow
        : null;
    const requestWindowLabel =
      activeRequestWindow === "today"
        ? "Today"
        : activeRequestWindow === "this-week"
          ? "This week"
          : activeRequestWindow === "flexible"
            ? "Flexible"
            : null;
    if (requestWindowLabel) {
      labels.push(`Timing: ${requestWindowLabel}`);
    }

    if (communityArea) {
      const communityAreaLabel = getCommunityMapAreaDefinition(communityArea as any)?.label ?? communityArea;
      labels.push(`Area: ${communityAreaLabel}`);
    }

    if (subcategory) {
      const subcategoryLabel =
        appliedSubcategories.find((item) => item.value === subcategory)?.label ?? subcategory;
      labels.push(subcategoryLabel);
    }

    if (minPrice !== null && minPrice !== undefined) {
      labels.push(`Min $${minPrice}`);
    }

    if (maxPrice !== null && maxPrice !== undefined) {
      labels.push(`Max $${maxPrice}`);
    }

    if (sort === "price_asc") {
      labels.push("Price low-high");
    } else if (sort === "price_desc") {
      labels.push("Price high-low");
    }

    structuredFilterDefinitions.forEach((field) => {
      const rawValue = structuredFilters?.[field.name];
      const value = serializeStructuredFilterValue(rawValue);

      if (!value) {
        return;
      }

      if (field.kind === "checkbox") {
        labels.push(value === "true" ? field.label : `No ${field.label.toLowerCase()}`);
        return;
      }

      const optionLabel = field.options?.find((option) => option.value === value)?.label ?? value;
      labels.push(optionLabel);
    });

    return labels;
  }, [
    category,
    intent,
    maxPrice,
    minPrice,
    communityArea,
    requestWindow,
    selectedCategory,
    showCategorySelect,
    sort,
    structuredFilterDefinitions,
    structuredFilters,
    subcategory
  ]);
  const activeFilterCount = activeFilterLabels.length;
  const clearHref = buildPathWithQuery(actionPath, {
    view
  });

  function trackFilterSubmit(surface: "mobile" | "desktop") {
    trackMarketplaceEvent("browse_filters_apply", {
      surface,
      category: category ?? selectedCategory ?? "all",
      intent: intent ?? selectedIntent ?? "all",
      has_query: Boolean((surface === "mobile" ? searchText : search)?.trim()),
      has_subcategory: Boolean(subcategory || selectedSubcategory),
      view: view ?? "list"
    });
  }

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
      <form
        action={actionPath}
        className="mobile-filter-row"
        method="get"
        onSubmit={() => trackFilterSubmit("mobile")}
      >
        {view ? <input name="view" type="hidden" value={view} /> : null}
        {category ? <input name="category" type="hidden" value={category} /> : null}
        {intent ? <input name="intent" type="hidden" value={intent} /> : null}
        {requestWindow ? <input name="requestWindow" type="hidden" value={requestWindow} /> : null}
        {communityArea ? <input name="communityArea" type="hidden" value={communityArea} /> : null}
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
          <span>Filter</span>
          {activeFilterCount > 0 ? <span className="mobile-filter-count">{activeFilterCount}</span> : null}
        </button>
      </form>

      {activeFilterCount > 0 ? (
        <div className="mobile-applied-filters">
          <div className="mobile-applied-filter-row">
            {activeFilterLabels.map((label) => (
              <span key={label} className="mobile-applied-filter-chip">
                {label}
              </span>
            ))}
          </div>
          <Link href={clearHref} className="mobile-applied-filter-clear">
            Clear
          </Link>
        </div>
      ) : null}

      {/* DESKTOP FULL FILTERS */}
      <form
        action={actionPath}
        className="surface desktop-filters browse-desktop-filters"
        method="get"
        onSubmit={() => trackFilterSubmit("desktop")}
      >
        {view ? <input name="view" type="hidden" value={view} /> : null}
        {communityArea ? <input name="communityArea" type="hidden" value={communityArea} /> : null}
        <div className="browse-filter-primary-grid">
          <label className="field filter-search browse-filter-search">
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

          <label className="field">
            <span className="field-label">Post type</span>
            <select
              className="select"
              name="intent"
              value={selectedIntent}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSelectedIntent(nextValue);
                if (nextValue !== "need") {
                  setSelectedRequestWindow("");
                }
              }}
            >
              <option value="">All posts</option>
              <option value="offer">Offers only</option>
              <option value="need">Needs only</option>
            </select>
          </label>

          {selectedIntent === "need" ? (
            <label className="field">
              <span className="field-label">Need timing</span>
              <select
                className="select"
                name="requestWindow"
                value={selectedRequestWindow}
                onChange={(event) => setSelectedRequestWindow(event.target.value)}
              >
                <option value="">Any timing</option>
                <option value="today">Today</option>
                <option value="this-week">This week</option>
                <option value="flexible">Flexible</option>
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
            <span className="field-label">Sort</span>
            <select className="select" name="sort" defaultValue={sort ?? ""}>
              <option value="">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </label>
        </div>

        <div className="browse-filter-detail-grid" key={activeStructuredCategory}>
          <label className="field browse-price-range-field browse-price-range-field-desktop">
            <span className="field-label">Price range</span>
            <div className="browse-price-range-inputs">
              <input
                className="input"
                name="minPrice"
                type="number"
                defaultValue={minPrice ?? ""}
                placeholder="Min $"
              />
              <input
                className="input"
                name="maxPrice"
                type="number"
                defaultValue={maxPrice ?? ""}
                placeholder="Max $"
              />
            </div>
          </label>

          {renderStructuredFilterFields()}
        </div>

        <div className="filter-actions browse-filter-actions-bar">
          <button className="button" type="submit">
            Apply
          </button>

          <Link href={clearHref} className="button button-secondary">
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
                Close
              </button>
            </div>

            <form action={actionPath} method="get" className="mobile-filter-sheet-form">
              <input type="hidden" name="q" value={searchText} />
              {view ? <input name="view" type="hidden" value={view} /> : null}

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

              <label className="field">
                <span className="field-label">Post type</span>
                <select
                  className="select"
                  name="intent"
                  value={selectedIntent}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSelectedIntent(nextValue);
                    if (nextValue !== "need") {
                      setSelectedRequestWindow("");
                    }
                  }}
                >
                  <option value="">All posts</option>
                  <option value="offer">Offers only</option>
                  <option value="need">Needs only</option>
                </select>
              </label>

              {selectedIntent === "need" ? (
                <label className="field">
                  <span className="field-label">Need timing</span>
                  <select
                    className="select"
                    name="requestWindow"
                    value={selectedRequestWindow}
                    onChange={(event) => setSelectedRequestWindow(event.target.value)}
                  >
                    <option value="">Any timing</option>
                    <option value="today">Today</option>
                    <option value="this-week">This week</option>
                    <option value="flexible">Flexible</option>
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

              <div className="browse-structured-filters" key={`${activeStructuredCategory}-mobile`}>
                {renderStructuredFilterFields()}
              </div>

              <div className="mobile-filter-sheet-actions">
                <Link href={clearHref} className="button button-secondary">
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
