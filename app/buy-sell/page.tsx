import Link from "next/link";

export default function BuySellPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm md:p-10">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          BUY & SELL
        </span>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
          Buy & Sell Locally
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Shop or sell furniture, electronics, tools, clothing, and everyday items with local buyers and sellers.
        </p>

        <Link
          href="/browse?category=buy-sell"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700"
        >
          View buy & sell listings
        </Link>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Furniture</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Find tables, chairs, couches, beds, and household items.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Tools & Equipment</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Buy and sell tools, work gear, and equipment locally.
          </p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Everyday Items</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Browse clothing, electronics, and useful items nearby.
          </p>
        </article>
      </section>
    </main>
  );
}
