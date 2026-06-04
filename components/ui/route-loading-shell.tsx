type RouteLoadingShellProps = {
  eyebrow?: string;
  title: string;
  message?: string;
  detail?: boolean;
  variant?: "feed" | "detail" | "chat" | "storefront" | "form";
};

function getLoadingHighlights(variant: NonNullable<RouteLoadingShellProps["variant"]>) {
  switch (variant) {
    case "chat":
      return ["Syncing conversation", "Checking unread replies", "Preparing composer"];
    case "storefront":
      return ["Loading business details", "Checking live listings", "Preparing contact options"];
    case "form":
      return ["Restoring draft fields", "Preparing uploads", "Checking contact settings"];
    case "detail":
      return ["Loading photos", "Checking seller info", "Preparing reply actions"];
    case "feed":
    default:
      return ["Checking newest local posts", "Preparing filters", "Loading cards"];
  }
}

export function RouteLoadingShell({
  eyebrow = "Loading",
  title,
  message = "Finding the latest local activity for you now.",
  detail = false,
  variant = detail ? "detail" : "feed"
}: RouteLoadingShellProps) {
  const highlights = getLoadingHighlights(variant);

  if (variant === "chat") {
    return (
      <section className="section">
        <div className="container">
          <div className="route-loading-shell route-loading-shell-chat">
            <div className="route-loading-hero surface">
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p className="route-loading-copy">{message}</p>
              <div className="route-loading-status-row">
                {highlights.map((item) => (
                  <span key={item} className="route-loading-status-pill">
                    <span className="route-loading-status-dot" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
              <div className="route-loading-line is-medium" />
            </div>

            <div className="route-loading-chat-grid">
              <div className="surface route-loading-chat-main">
                <div className="route-loading-chat-bubble is-theirs" />
                <div className="route-loading-chat-bubble is-mine" />
                <div className="route-loading-chat-bubble is-theirs is-short" />
                <div className="route-loading-chat-composer" />
              </div>

              <div className="surface route-loading-chat-side">
                <div className="route-loading-line is-short" />
                <div className="route-loading-line is-medium" />
                <div className="route-loading-chip-row">
                  <span className="route-loading-chip" />
                  <span className="route-loading-chip" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "storefront") {
    return (
      <section className="section">
        <div className="container">
          <div className="route-loading-shell route-loading-shell-storefront">
            <div className="route-loading-storefront-hero surface">
              <div className="route-loading-storefront-profile">
                <div className="route-loading-storefront-avatar" />
                <div className="route-loading-storefront-copy">
                  <span className="eyebrow">{eyebrow}</span>
                  <h1>{title}</h1>
                  <p className="route-loading-copy">{message}</p>
                  <div className="route-loading-status-row">
                    {highlights.map((item) => (
                      <span key={item} className="route-loading-status-pill">
                        <span className="route-loading-status-dot" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                  <div className="route-loading-line is-medium" />
                  <div className="route-loading-chip-row">
                    <span className="route-loading-chip" />
                    <span className="route-loading-chip" />
                    <span className="route-loading-chip" />
                  </div>
                </div>
              </div>
              <div className="route-loading-storefront-stats">
                <span className="route-loading-field" />
                <span className="route-loading-field" />
                <span className="route-loading-field" />
              </div>
            </div>

            <div className="route-loading-filter-card surface">
              <div className="route-loading-chip-row">
                <span className="route-loading-chip" />
                <span className="route-loading-chip" />
                <span className="route-loading-chip" />
              </div>
            </div>

            <div className="route-loading-listing-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="surface route-loading-card">
                  <div className="route-loading-card-media" />
                  <div className="route-loading-line is-short" />
                  <div className="route-loading-line is-medium" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "form") {
    return (
      <section className="section">
        <div className="container">
          <div className="route-loading-shell route-loading-shell-form">
            <div className="route-loading-hero surface">
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p className="route-loading-copy">{message}</p>
              <div className="route-loading-status-row">
                {highlights.map((item) => (
                  <span key={item} className="route-loading-status-pill">
                    <span className="route-loading-status-dot" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
              <div className="route-loading-line is-medium" />
            </div>

            <div className="surface route-loading-form-card">
              <div className="route-loading-filter-row">
                <span className="route-loading-field" />
                <span className="route-loading-field" />
              </div>
              <div className="route-loading-filter-row">
                <span className="route-loading-field" />
                <span className="route-loading-field" />
              </div>
              <div className="route-loading-media route-loading-form-textarea" />
              <div className="route-loading-filter-row">
                <span className="route-loading-field is-wide" />
                <span className="route-loading-field" />
              </div>
              <div className="route-loading-chip-row">
                <span className="route-loading-chip" />
                <span className="route-loading-chip" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="route-loading-shell">
          <div className="route-loading-hero surface">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="route-loading-copy">{message}</p>
            <div className="route-loading-status-row">
              {highlights.map((item) => (
                <span key={item} className="route-loading-status-pill">
                  <span className="route-loading-status-dot" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
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
