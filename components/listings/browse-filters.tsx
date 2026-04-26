"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CATEGORIES } from "@/lib/constants";
import { getSubcategories } from "@/lib/subcategories";
import type { ListingCategory } from "@/types/database";

export function BrowseFilters({
  actionPath,
  search,
  category,
  subcategory,
  showCategorySelect = true
}: any) {
  const [selectedCategory, setSelectedCategory] = useState(category ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategory ?? "");

  const subcategories = useMemo(
    () => getSubcategories(selectedCategory),
    [selectedCategory]
  );

  return (
    <form action={actionPath} className="surface filters-grid" method="get">

      {/* SEARCH */}
      <input name="q" defaultValue={search} placeholder="Search..." className="input" />

      {/* CATEGORY */}
      {showCategorySelect && (
        <select
          name="category"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory("");
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      )}

      {/* SUBCATEGORY */}
      {subcategories.length > 0 && (
        <select
          name="subcategory"
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
        >
          <option value="">All subcategories</option>
          {subcategories.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}

      {/* PRICE */}
      <input name="minPrice" type="number" placeholder="Min $" className="input" />
      <input name="maxPrice" type="number" placeholder="Max $" className="input" />

      {/* SORT */}
      <select name="sort">
        <option value="">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>

      {/* ACTIONS */}
      <button className="button">Apply</button>
      <Link href={actionPath} className="button button-secondary">Clear</Link>
    </form>
  );
}