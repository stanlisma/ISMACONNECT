import Link from "next/link";

export default function JobsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm md:p-10">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          JOBS
        </span>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Jobs in Fort McMurray
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Browse part-time, full-time, contract, and local job opportunities posted by people and businesses in the region.
        </p>

        <Link
          href="/browse?category=jobs"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700"
        >
          View job listings
        </Link>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Local Work</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Find opportunities close to home and around Fort McMurray.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Contract Roles</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Browse short-term, project-based, and flexible work.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Hiring Posts</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Businesses can reach local workers faster.
          </p>
        </article>
      </section>
    </main>
  );
}
