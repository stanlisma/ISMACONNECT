import Link from "next/link";

export default function RentalsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm md:p-10">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          RENTALS
        </span>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Rentals in Fort McMurray
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Browse apartments, rooms, furnished rentals, storage, and short-term rental opportunities across Fort McMurray.
        </p>

        <Link
          href="/browse?category=rentals"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700"
        >
          View rental listings
        </Link>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Furnished Rentals</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Find rooms, suites, and apartments ready for workers and locals.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Short-Term Stays</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Browse flexible rental options for temporary stays and shift work.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Storage & Space</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Discover storage, parking, and extra space listings nearby.
          </p>
        </article>
      </section>
    </main>
  );
}
