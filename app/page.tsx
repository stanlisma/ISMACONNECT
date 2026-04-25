import Link from "next/link";
import { getViewer } from "@/lib/auth";

export default async function HomePage() {
  const viewer = await getViewer();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
          LOCAL FIRST
        </span>

        <h1 className="mt-4 text-4xl font-bold text-slate-900">
          Buy, sell, hire, and move around Fort McMurray faster.
        </h1>

        <p className="mt-3 text-slate-600">
          Fort McMurray's local marketplace for everyday needs.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <form
            action="/browse"
            className="flex w-full max-w-xl items-center gap-2"
          >
            <input
              name="q"
              placeholder="Rentals, camp rides, tools, cleaning, jobs..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white"
            >
              Explore listings
            </button>
          </form>

          {/* ✅ ONLY CHANGE — hide when logged in */}
          {!viewer && (
            <Link
              href="/auth/sign-up"
              className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-700"
            >
              Create account
            </Link>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/browse?category=rentals" className="pill-link">
            Rentals
          </Link>
          <Link href="/browse?category=ride-share" className="pill-link">
            Ride Share
          </Link>
          <Link href="/browse?category=jobs" className="pill-link">
            Jobs
          </Link>
          <Link href="/browse?category=services" className="pill-link">
            Services
          </Link>
          <Link href="/browse?category=buy-sell" className="pill-link">
            Buy & Sell
          </Link>
        </div>
      </section>
    </main>
  );
}