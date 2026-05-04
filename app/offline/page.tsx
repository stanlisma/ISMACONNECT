import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "680px" }}>
        <div className="surface offline-surface">
          <span className="eyebrow">Offline</span>
          <h1 className="section-title">You&apos;re temporarily offline</h1>
          <p className="section-copy">
            ISMACONNECT can keep the latest loaded pages available, but posting, messaging,
            and live search updates need a connection. Reconnect and try again.
          </p>

          <div className="action-row">
            <Link className="button" href="/browse">
              Open cached listings
            </Link>
            <Link className="button button-secondary" href="/">
              Back home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
