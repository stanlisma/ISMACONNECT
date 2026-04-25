import Link from "next/link";

export default function SavedPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm md:p-10">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          SAVED
        </span>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Saved Listings
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Keep track of listings you want to revisit later. Your saved rentals, rides, jobs, services, and items will appear here.
        </p>

        <Link
          href="/browse"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700"
        >
          Browse listings
        </Link>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Save Favorites</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Quickly return to listings you are interested in.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Compare Options</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep useful listings together while you decide.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Act Later</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Come back when you are ready to message, apply, or buy.
          </p>
        </article>
      </section>
    </main>
  );
}
