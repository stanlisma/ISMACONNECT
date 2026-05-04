"use client";

import Link from "next/link";
import { useState } from "react";

interface DashboardListingControlsProps {
  searchQuery: string;
  statusFilter: string;
  promotionFilter: string;
  categoryFilter: string | null;
  filteredCount: number;
  totalCount: number;
}

export function DashboardListingControls({
  searchQuery,
  statusFilter,
  promotionFilter,
  categoryFilter,
  filteredCount,
  totalCount
}: DashboardListingControlsProps) {
  const [searchText, setSearchText] = useState(searchQuery);
  const [selectedStatus, setSelectedStatus] = useState(statusFilter);
  const [selectedPromotion, setSelectedPromotion] = useState(promotionFilter);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter ?? "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <>
      <form action="/dashboard" method="get" className="dashboard-mobile-controls mobile-filter-row">
        {selectedStatus !== "all" ? <input type="hidden" name="status" value={selectedStatus} /> : null}
        {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
        {selectedPromotion !== "all" ? (
          <input type="hidden" name="promotion" value={selectedPromotion} />
        ) : null}

        <input
          className="input mobile-filter-search"
          type="search"
          name="q"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by title or location"
        />

        <button
          type="button"
          className="button mobile-filter-button"
          aria-haspopup="dialog"
          aria-expanded={isFilterOpen}
          onClick={() => setIsFilterOpen(true)}
        >
          Filter
        </button>
      </form>

      <form action="/dashboard" method="get" className="dashboard-desktop-controls">
        <div className="dashboard-filters-grid">
          <label className="field dashboard-filter-search" style={{ marginBottom: 0 }}>
            <span className="field-label">Search</span>
            <input
              className="input"
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by title or location"
            />
          </label>

          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">Status</span>
            <select className="select" name="status" defaultValue={statusFilter}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="flagged">Flagged</option>
              <option value="removed">Removed</option>
            </select>
          </label>

          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">Category</span>
            <select className="select" name="category" defaultValue={categoryFilter ?? ""}>
              <option value="">All</option>
              <option value="rentals">Rentals</option>
              <option value="ride-share">Ride Share</option>
              <option value="jobs">Jobs</option>
              <option value="services">Services</option>
              <option value="buy-sell">Buy & Sell</option>
            </select>
          </label>

          <label className="field" style={{ marginBottom: 0 }}>
            <span className="field-label">Promotion</span>
            <select className="select" name="promotion" defaultValue={promotionFilter}>
              <option value="all">All</option>
              <option value="promoted">Any active promo</option>
              <option value="featured">Featured</option>
              <option value="boosted">Boosted</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>

        <div className="dashboard-filter-actions">
          <span className="section-copy" style={{ marginBottom: 0 }}>
            Showing {filteredCount} of {totalCount} listings
          </span>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="button" type="submit">
              Apply filters
            </button>
            <Link className="button button-secondary" href="/dashboard">
              Clear
            </Link>
          </div>
        </div>
      </form>

      <p className="dashboard-filter-summary section-copy">
        Showing {filteredCount} of {totalCount} listings
      </p>

      {isFilterOpen ? (
        <div className="mobile-filter-backdrop" onClick={() => setIsFilterOpen(false)}>
          <div className="mobile-filter-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-filter-sheet-header">
              <h3>Filters</h3>
              <button type="button" aria-label="Close filters" onClick={() => setIsFilterOpen(false)}>
                X
              </button>
            </div>

            <form action="/dashboard" method="get" className="mobile-filter-sheet-form">
              <label className="field">
                <span className="field-label">Search</span>
                <input
                  className="input"
                  type="search"
                  name="q"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by title or location"
                />
              </label>

              <label className="field">
                <span className="field-label">Status</span>
                <select
                  className="select"
                  name="status"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="flagged">Flagged</option>
                  <option value="removed">Removed</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">Category</span>
                <select
                  className="select"
                  name="category"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  <option value="">All</option>
                  <option value="rentals">Rentals</option>
                  <option value="ride-share">Ride Share</option>
                  <option value="jobs">Jobs</option>
                  <option value="services">Services</option>
                  <option value="buy-sell">Buy & Sell</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">Promotion</span>
                <select
                  className="select"
                  name="promotion"
                  value={selectedPromotion}
                  onChange={(event) => setSelectedPromotion(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="promoted">Any active promo</option>
                  <option value="featured">Featured</option>
                  <option value="boosted">Boosted</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <div className="mobile-filter-sheet-actions">
                <Link href="/dashboard" className="button button-secondary">
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
