type RouteLoadingShellProps = {
  eyebrow?: string;
  title: string;
  detail?: boolean;
};

export function RouteLoadingShell({
  eyebrow = "Loading",
  title,
  detail = false
}: RouteLoadingShellProps) {
  return (
    <section className="section">
      <div className="container">
        <div className="route-loading-shell">
          <div className="route-loading-hero surface">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <div className="route-loading-line is-long" />
            <div className="route-loading-chip-row">
              <span className="route-loading-chip" />
              <span className="route-loading-chip" />
              <span className="route-loading-chip" />
            </div>
          </div>

          {detail ? (
            <div className="route-loading-detail-grid">
              <div className="surface route-loading-detail-main">
                <div className="route-loading-media" />
                <div className="route-loading-line is-short" />
                <div className="route-loading-line is-long" />
                <div className="route-loading-line is-medium" />
              </div>

              <div className="surface route-loading-detail-side">
                <div className="route-loading-line is-short" />
                <div className="route-loading-line is-medium" />
                <div className="route-loading-chip-row">
                  <span className="route-loading-chip" />
                  <span className="route-loading-chip" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="surface route-loading-filter-card">
                <div className="route-loading-filter-row">
                  <span className="route-loading-field is-wide" />
                  <span className="route-loading-field" />
                  <span className="route-loading-field" />
                  <span className="route-loading-field" />
                </div>
                <div className="route-loading-filter-row">
                  <span className="route-loading-field" />
                  <span className="route-loading-field" />
                  <span className="route-loading-field" />
                </div>
              </div>

              <div className="route-loading-listing-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="surface route-loading-card">
                    <div className="route-loading-card-media" />
                    <div className="route-loading-line is-short" />
                    <div className="route-loading-line is-medium" />
                    <div className="route-loading-line is-long" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
