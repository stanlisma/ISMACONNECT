"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/analytics";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      source: "app-error-boundary",
      name: error.name,
      message: error.message || "App route error",
      stack: error.stack ?? null,
      metadata: {
        digest: error.digest ?? null
      }
    });
  }, [error]);

  return (
    <section className="section">
      <div className="container">
        <div className="surface empty-state">
          <span className="eyebrow">Something went wrong</span>
          <h1 className="section-title">We hit a page error</h1>
          <p className="section-copy">
            The issue has been logged. Try reloading this part of the app and, if it keeps happening, contact support.
          </p>
          <div className="action-row">
            <button className="button" type="button" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
