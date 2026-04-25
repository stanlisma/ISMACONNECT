import Link from "next/link";
import { getViewer } from "@/lib/auth";

export default async function HomePage() {
  const viewer = await getViewer();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="hero-card">
        <span className="hero-badge">LOCAL FIRST</span>

        <h1 className="hero-title">
          Buy, sell, hire, and move around Fort McMurray faster.
        </h1>

        <p className="hero-subtitle">
          Fort McMurray's local marketplace for everyday needs.
        </p>

        {/* SEARCH */}
        <div className="hero-search">
          <form action="/browse" className="hero-search-bar">
            <input
              name="q"
              placeholder="Rentals, camp rides, tools, cleaning, jobs..."
            />

            <button type="submit">Explore listings</button>
          </form>

          {/* ✅ FIX ONLY HERE */}
          {!viewer && (
            <Link href="/auth/sign-up" className="hero-secondary-btn">
              Create account
            </Link>
          )}
        </div>

        {/* CATEGORY PILLS */}
        <div className="hero-pills">
          <Link href="/browse?category=rentals">Rentals</Link>
          <Link href="/browse?category=ride-share">Ride Share</Link>
          <Link href="/browse?category=jobs">Jobs</Link>
          <Link href="/browse?category=services">Services</Link>
          <Link href="/browse?category=buy-sell">Buy & Sell</Link>
        </div>
      </section>
    </main>
  );
}