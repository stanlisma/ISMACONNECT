"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/analytics";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      source: "app-global-error",
      name: error.name,
      message: error.message || "Global app error",
      stack: error.stack ?? null,
      metadata: {
        digest: error.digest ?? null
      }
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <section className="section">
          <div className="container">
            <div className="surface empty-state">
              <span className="eyebrow">App error</span>
              <h1 className="section-title">ISMACONNECT needs a refresh</h1>
              <p className="section-copy">
                We logged the problem. Try loading the app again, and if it keeps failing, contact support.
              </p>
              <div className="action-row">
                <button className="button" type="button" onClick={() => reset()}>
                  Reload app
                </button>
              </div>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
