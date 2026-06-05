"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { trackMarketplaceEvent } from "@/lib/analytics";
import { CATEGORIES } from "@/lib/constants";
import {
  getStructuredFilterDefinitions,
  serializeStructuredFilterValue
} from "@/lib/listing-structured-fields";
import { getCommunityMapAreaDefinition } from "@/lib/local-marketplace";
import { getSubcategories, normalizeSubcategory } from "@/lib/subcategories";
import { buildPathWithQuery } from "@/lib/utils";

function formatFilterDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function getBrowseSearchPlaceholder(category?: string | null) {
  switch (category) {
    case "ride-share":
      return "Search camp rides, airport trips, routes...";
    case "rentals":
      return "Search rooms, apartments, rentals...";
    case "services":
      return "Search cleaners, movers, local services...";
    case "jobs":
      return "Search camp jobs, shifts, local work...";
    case "buy-sell":
      return "Search furniture, tools, electronics...";
    default:
      return "Search rides, rentals, services, jobs...";
  }
}

const compactPriceFormatter = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 1,
  notation: "compact"
});

function formatPriceFilterLabel(minPrice?: number | null, maxPrice?: number | null) {
  if (minPrice !== null && minPrice !== undefined && maxPrice !== null && maxPrice !== undefined) {
    return `$${compactPriceFormatter.format(minPrice)}-$${compactPriceFormatter.format(maxPrice)}`;
  }

  if (minPrice !== null && minPrice !== undefined) {
    return `$${compactPriceFormatter.format(minPrice)}+`;
  }

  if (maxPrice !== null && maxPrice !== undefined) {
    return `Up to $${compactPriceFormatter.format(maxPrice)}`;
  }

  return "Price";
}

function getSortFilterLabel(sort?: string | null) {
  switch (sort) {
    case "price_asc":
      return "Low-high";
    case "price_desc":
      return "High-low";
    default:
      return "Newest";
  }
}

function getIntentFilterLabel(intent?: string | null) {
  switch (intent) {
    case "need":
      return "Needs";
    case "offer":
      return "Offers";
    default:
      return "Post type";
  }
}

function getRequestWindowFilterLabel(requestWindow?: string | null) {
  switch (requestWindow) {
    case "today":
      return "Today";
    case "this-week":
      return "This week";
    case "flexible":
      return "Flexible";
    default:
      return "Timing";
  }
}

type MobileQuickFilterKey =
  | "category"
  | "intent"
  | "price"
  | "requestWindow"
  | "sort"
  | "subcategory";

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
  const syncFromAppliedFilters = () => {
    setSearchText(search ?? "");
    setSelectedCategory(category ?? "");
    setSelectedIntent(intent ?? "");
    setSelectedRequestWindow(requestWindow ?? "");
    setSelectedSubcategory(normalizeSubcategory(category ?? "", subcategory ?? "") ?? "");
    setMinPriceText(minPrice?.toString() ?? "");
    setMaxPriceText(maxPrice?.toString() ?? "");
  };

  const mobileFilterShellRef = useRef<HTMLDivElement | null>(null);
  const [searchText, setSearchText] = useState(search ?? "");
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedIntent, setSelectedIntent] = useState(intent ?? "");
  const [selectedRequestWindow, setSelectedRequestWindow] = useState(requestWindow ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    normalizeSubcategory(category ?? "", subcategory ?? "") ?? ""
  );
  const [minPriceText, setMinPriceText] = useState(minPrice?.toString() ?? "");
  const [maxPriceText, setMaxPriceText] = useState(maxPrice?.toString() ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickFilterOpen, setQuickFilterOpen] = useState<MobileQuickFilterKey | null>(null);

  useEffect(() => {
    syncFromAppliedFilters();
    setIsFilterOpen(false);
    setQuickFilterOpen(null);
  }, [category, intent, maxPrice, minPrice, requestWindow, search, subcategory]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (!quickFilterOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!mobileFilterShellRef.current?.contains(event.target as Node)) {
        setQuickFilterOpen(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [quickFilterOpen]);

  const subcategories = useMemo(() => getSubcategories(selectedCategory), [selectedCategory]);
  const activeStructuredCategory = (showCategorySelect ? selectedCategory : category) ?? "";
  const structuredFilterDefinitions = useMemo(
    () => getStructuredFilterDefinitions(activeStructuredCategory as any),
    [activeStructuredCategory]
  );
  const searchPlaceholder = getBrowseSearchPlaceholder(showCategorySelect ? selectedCategory : category);
  const hasDesktopSecondaryRow =
    selectedIntent === "need" || subcategories.length > 0 || structuredFilterDefinitions.length > 0;
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

      if (field.kind === "date") {
        labels.push(`${field.label}: ${formatFilterDate(value)}`);
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
  const activeFilterSummary = useMemo(() => {
    if (!activeFilterCount) {
      return null;
    }

    if (activeFilterCount === 1) {
      return activeFilterLabels[0];
    }

    const primaryLabel = activeFilterLabels[0];
    return primaryLabel ? `${primaryLabel} +${activeFilterCount - 1}` : `${activeFilterCount} filters active`;
  }, [activeFilterCount, activeFilterLabels]);
  const mobileFilterChips = useMemo(() => {
    const chips: Array<{
      active: boolean;
      key: "filters" | MobileQuickFilterKey;
      label: string;
      primary?: boolean;
    }> = [
      {
        key: "filters",
        label: activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters",
        active: activeFilterCount > 0,
        primary: true
      }
    ];

    if (showCategorySelect) {
      chips.push({
        key: "category",
        label:
          CATEGORIES.find((item) => item.value === selectedCategory)?.label ?? "Category",
        active: Boolean(selectedCategory)
      });
    }

    chips.push({
      key: "intent",
      label: getIntentFilterLabel(selectedIntent),
      active: Boolean(selectedIntent)
    });

    if (selectedIntent === "need" || selectedRequestWindow) {
      chips.push({
        key: "requestWindow",
        label: getRequestWindowFilterLabel(selectedRequestWindow),
        active: Boolean(selectedRequestWindow)
      });
    }

    if (subcategories.length > 0 || selectedSubcategory) {
      chips.push({
        key: "subcategory",
        label:
          subcategories.find((item) => item.value === selectedSubcategory)?.label ?? "Subcategory",
        active: Boolean(selectedSubcategory)
      });
    }

    chips.push({
      key: "price",
      label: formatPriceFilterLabel(minPrice, maxPrice),
      active: minPrice !== null || maxPrice !== null
    });

    chips.push({
      key: "sort",
      label: getSortFilterLabel(sort),
      active: Boolean(sort)
    });

    return chips;
  }, [
    activeFilterCount,
    maxPrice,
    minPrice,
    selectedCategory,
    selectedIntent,
    selectedRequestWindow,
    selectedSubcategory,
    showCategorySelect,
    sort,
    subcategories
  ]);
  const clearHref = buildPathWithQuery(actionPath, {
    view
  });
  const structuredFilterReset = useMemo(
    () =>
      Object.fromEntries(Object.keys((structuredFilters ?? {}) as Record<string, unknown>).map((key) => [key, undefined])),
    [structuredFilters]
  );
  const mobileBaseQuery = useMemo(
    () => ({
      q: searchText.trim() ? searchText : undefined,
      category: showCategorySelect ? selectedCategory || undefined : category ?? undefined,
      intent: selectedIntent || undefined,
      requestWindow: selectedIntent === "need" ? selectedRequestWindow || undefined : undefined,
      communityArea:
        (showCategorySelect ? selectedCategory || category : category) === "ride-share"
          ? undefined
          : communityArea ?? undefined,
      subcategory: selectedSubcategory || undefined,
      minPrice: minPriceText ? Number(minPriceText) : undefined,
      maxPrice: maxPriceText ? Number(maxPriceText) : undefined,
      sort: sort ?? undefined,
      view: view ?? undefined,
      ...(structuredFilters ?? {})
    }),
    [
      category,
      communityArea,
      maxPriceText,
      minPriceText,
      searchText,
      selectedCategory,
      selectedIntent,
      selectedRequestWindow,
      selectedSubcategory,
      showCategorySelect,
      sort,
      structuredFilters,
      view
    ]
  );

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

          if (field.kind === "date") {
            return (
              <label key={field.name} className="field">
                <span className="field-label">{field.label}</span>
                <input className="input" type="date" name={field.name} defaultValue={defaultValue} />
              </label>
            );
          }

          if (field.kind === "number") {
            return (
              <label key={field.name} className="field">
                <span className="field-label">{field.label}</span>
                <input className="input" type="number" name={field.name} defaultValue={defaultValue} />
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

  function openMobileSheet() {
    setQuickFilterOpen(null);
    setIsFilterOpen(true);
  }

  function toggleQuickFilter(filterKey: MobileQuickFilterKey) {
    setIsFilterOpen(false);
    setQuickFilterOpen((current) => (current === filterKey ? null : filterKey));
  }

  function renderQuickFilterPanel() {
    if (!quickFilterOpen) {
      return null;
    }

    if (quickFilterOpen === "category" && showCategorySelect) {
      return (
        <div className="mobile-filter-quick-panel" role="menu" aria-label="Category">
          <div className="mobile-filter-quick-options">
            <Link
              href={buildPathWithQuery(actionPath, {
                ...mobileBaseQuery,
                category: undefined,
                subcategory: undefined,
                communityArea: undefined,
                ...structuredFilterReset
              })}
              className={`mobile-filter-quick-option${!selectedCategory ? " is-active" : ""}`}
            >
              All categories
            </Link>
            {CATEGORIES.map((item) => (
              <Link
                key={item.value}
                href={buildPathWithQuery(actionPath, {
                  ...mobileBaseQuery,
                  category: item.value,
                  subcategory: undefined,
                  communityArea: item.value === "ride-share" ? undefined : communityArea ?? undefined,
                  ...structuredFilterReset
                })}
                className={`mobile-filter-quick-option${selectedCategory === item.value ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (quickFilterOpen === "intent") {
      return (
        <div className="mobile-filter-quick-panel" role="menu" aria-label="Post type">
          <div className="mobile-filter-quick-options">
            {[
              { label: "All posts", value: "" },
              { label: "Offers only", value: "offer" },
              { label: "Needs only", value: "need" }
            ].map((option) => (
              <Link
                key={option.label}
                href={buildPathWithQuery(actionPath, {
                  ...mobileBaseQuery,
                  intent: option.value || undefined,
                  requestWindow: option.value === "need" ? selectedRequestWindow || undefined : undefined
                })}
                className={`mobile-filter-quick-option${(selectedIntent || "") === option.value ? " is-active" : ""}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (quickFilterOpen === "requestWindow") {
      return (
        <div className="mobile-filter-quick-panel" role="menu" aria-label="Need timing">
          <div className="mobile-filter-quick-options">
            {[
              { label: "Any timing", value: "" },
              { label: "Today", value: "today" },
              { label: "This week", value: "this-week" },
              { label: "Flexible", value: "flexible" }
            ].map((option) => (
              <Link
                key={option.label}
                href={buildPathWithQuery(actionPath, {
                  ...mobileBaseQuery,
                  requestWindow: option.value || undefined,
                  intent: "need"
                })}
                className={`mobile-filter-quick-option${(selectedRequestWindow || "") === option.value ? " is-active" : ""}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (quickFilterOpen === "subcategory" && subcategories.length > 0) {
      return (
        <div className="mobile-filter-quick-panel" role="menu" aria-label="Subcategory">
          <div className="mobile-filter-quick-options">
            <Link
              href={buildPathWithQuery(actionPath, {
                ...mobileBaseQuery,
                subcategory: undefined
              })}
              className={`mobile-filter-quick-option${!selectedSubcategory ? " is-active" : ""}`}
            >
              All subcategories
            </Link>
            {subcategories.map((item) => (
              <Link
                key={item.value}
                href={buildPathWithQuery(actionPath, {
                  ...mobileBaseQuery,
                  subcategory: item.value
                })}
                className={`mobile-filter-quick-option${selectedSubcategory === item.value ? " is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (quickFilterOpen === "sort") {
      return (
        <div className="mobile-filter-quick-panel" role="menu" aria-label="Sort">
          <div className="mobile-filter-quick-options">
            {[
              { label: "Newest first", value: "" },
              { label: "Price: low to high", value: "price_asc" },
              { label: "Price: high to low", value: "price_desc" }
            ].map((option) => (
              <Link
                key={option.label}
                href={buildPathWithQuery(actionPath, {
                  ...mobileBaseQuery,
                  sort: option.value || undefined
                })}
                className={`mobile-filter-quick-option${(sort || "") === option.value ? " is-active" : ""}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (quickFilterOpen === "price") {
      return (
        <div className="mobile-filter-quick-panel" role="dialog" aria-label="Price">
          <form
            action={actionPath}
            method="get"
            className="mobile-filter-price-form"
            onSubmit={() => trackFilterSubmit("mobile")}
          >
            {view ? <input name="view" type="hidden" value={view} /> : null}
            {showCategorySelect ? (
              selectedCategory ? <input name="category" type="hidden" value={selectedCategory} /> : null
            ) : category ? (
              <input name="category" type="hidden" value={category} />
            ) : null}
            {selectedIntent ? <input name="intent" type="hidden" value={selectedIntent} /> : null}
            {selectedIntent === "need" && selectedRequestWindow ? (
              <input name="requestWindow" type="hidden" value={selectedRequestWindow} />
            ) : null}
            {communityArea && (showCategorySelect ? selectedCategory || category : category) !== "ride-share" ? (
              <input name="communityArea" type="hidden" value={communityArea} />
            ) : null}
            {selectedSubcategory ? <input name="subcategory" type="hidden" value={selectedSubcategory} /> : null}
            {sort ? <input name="sort" type="hidden" value={sort} /> : null}
            {searchText.trim() ? <input name="q" type="hidden" value={searchText.trim()} /> : null}
            {Object.entries((structuredFilters ?? {}) as Record<string, string | boolean>).map(([key, value]) => (
              <input key={key} name={key} type="hidden" value={serializeStructuredFilterValue(value)} />
            ))}

            <div className="mobile-filter-price-grid">
              <input
                className="input"
                name="minPrice"
                type="number"
                inputMode="numeric"
                placeholder="Min $"
                value={minPriceText}
                onChange={(event) => setMinPriceText(event.target.value)}
              />
              <input
                className="input"
                name="maxPrice"
                type="number"
                inputMode="numeric"
                placeholder="Max $"
                value={maxPriceText}
                onChange={(event) => setMaxPriceText(event.target.value)}
              />
            </div>

            <div className="mobile-filter-price-actions">
              <Link
                href={buildPathWithQuery(actionPath, {
                  ...mobileBaseQuery,
                  minPrice: undefined,
                  maxPrice: undefined
                })}
                className="button button-secondary"
              >
                Clear
              </Link>
              <button className="button" type="submit">
                Apply
              </button>
            </div>
          </form>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      {/* MOBILE COMPACT SEARCH */}
      <div className="mobile-filter-shell" ref={mobileFilterShellRef}>
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
            placeholder={searchPlaceholder}
            value={searchText}
          />

          <button
            className="button button-secondary mobile-filter-submit"
            type="submit"
            aria-label="Search listings"
          >
            <Search aria-hidden="true" size={18} strokeWidth={2.4} />
            <span>Search</span>
          </button>
        </form>

        <div className="mobile-filter-chip-row" aria-label="Swipe filters">
          {mobileFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-expanded={chip.key === "filters" ? isFilterOpen : quickFilterOpen === chip.key}
              aria-haspopup={chip.key === "filters" ? "dialog" : "menu"}
              className={`mobile-filter-chip${chip.active ? " is-active" : ""}${chip.primary ? " is-primary" : ""}`}
              onClick={() => {
                if (chip.key === "filters") {
                  openMobileSheet();
                  return;
                }

                toggleQuickFilter(chip.key);
              }}
            >
              {chip.primary ? <SlidersHorizontal aria-hidden="true" size={15} strokeWidth={2.2} /> : null}
              <span>{chip.label}</span>
              <ChevronDown aria-hidden="true" size={15} strokeWidth={2.2} />
            </button>
          ))}

          {activeFilterSummary ? (
            <span className="mobile-filter-chip-summary" aria-hidden="true">
              {activeFilterSummary}
            </span>
          ) : null}

          {activeFilterCount > 0 ? (
            <Link href={clearHref} className="mobile-filter-clear-chip">
              Clear
            </Link>
          ) : null}
        </div>

        {renderQuickFilterPanel()}
      </div>

      {/* DESKTOP FULL FILTERS */}
      <form
        action={actionPath}
        className="surface desktop-filters browse-desktop-filters"
        method="get"
        onSubmit={() => trackFilterSubmit("desktop")}
      >
        {view ? <input name="view" type="hidden" value={view} /> : null}
        {communityArea ? <input name="communityArea" type="hidden" value={communityArea} /> : null}
        <div className={`browse-filter-primary-grid${!hasDesktopSecondaryRow ? " is-compact" : ""}`}>
          <label className="field filter-search browse-filter-search">
            <span className="field-label">Search</span>
            <input
              className="input"
              name="q"
              defaultValue={search ?? ""}
              placeholder={searchPlaceholder}
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

          <label className="field">
            <span className="field-label">Sort</span>
            <select className="select" name="sort" defaultValue={sort ?? ""}>
              <option value="">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </label>

          {!hasDesktopSecondaryRow ? (
            <label className="field browse-price-range-field browse-price-range-field-desktop is-compact">
              <span className="field-label">Price range</span>
              <div className="browse-price-range-inputs is-compact">
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
          ) : null}

          {!hasDesktopSecondaryRow ? (
            <div className="filter-actions browse-filter-actions-inline">
              <button className="button" type="submit">
                Apply
              </button>

              <Link href={clearHref} className="button button-secondary">
                Clear
              </Link>
            </div>
          ) : null}
        </div>

        {hasDesktopSecondaryRow ? (
          <div className="browse-filter-detail-grid" key={activeStructuredCategory}>
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
        ) : null}

        {hasDesktopSecondaryRow ? (
          <div className="filter-actions browse-filter-actions-bar">
            <button className="button" type="submit">
              Apply
            </button>

            <Link href={clearHref} className="button button-secondary">
              Clear
            </Link>
          </div>
        ) : null}
      </form>

      {/* MOBILE FILTER SHEET */}
      {isFilterOpen ? (
        <div
          className="mobile-filter-backdrop"
          onClick={() => {
            syncFromAppliedFilters();
            setIsFilterOpen(false);
          }}
        >
          <div
            className="mobile-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Browse filters"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-filter-sheet-header">
              <h3>Filters</h3>
              <button
                aria-label="Close filters"
                type="button"
                onClick={() => {
                  syncFromAppliedFilters();
                  setIsFilterOpen(false);
                }}
              >
                <X aria-hidden="true" size={18} strokeWidth={2.4} />
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
