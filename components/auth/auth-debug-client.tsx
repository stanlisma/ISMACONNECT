"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ServerAuthDiagnostics } from "@/lib/auth-debug";

type ClientAuthDiagnostics = {
  timestamp: string;
  location: {
    href: string;
    host: string;
    origin: string;
  };
  cookies: {
    names: string[];
    authCookieNames: string[];
  };
  auth: {
    user: {
      id: string;
      email: string | null;
    } | null;
    userError: string | null;
    sessionUserId: string | null;
    sessionExpiresAt: number | null;
    sessionError: string | null;
  };
};

function formatCookieNames(cookieString: string) {
  return cookieString
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split("=")[0])
    .filter(Boolean);
}

function renderJsonBlock(title: string, data: unknown) {
  return (
    <article className="detail-card auth-debug-card">
      <h2>{title}</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </article>
  );
}

export function AuthDebugClient({
  initialServerDiagnostics
}: {
  initialServerDiagnostics: ServerAuthDiagnostics;
}) {
  const [clientDiagnostics, setClientDiagnostics] = useState<ClientAuthDiagnostics | null>(null);
  const [liveServerDiagnostics, setLiveServerDiagnostics] =
    useState<ServerAuthDiagnostics>(initialServerDiagnostics);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadDiagnostics() {
      try {
        const cookieNames = formatCookieNames(document.cookie);
        const authCookieNames = cookieNames.filter(
          (name) => name.startsWith("sb-") && name.includes("-auth-token")
        );
        const supabase = createBrowserSupabaseClient();
        const [
          { data: sessionData, error: sessionError },
          { data: userData, error: userError },
          serverDiagnosticsResponse
        ] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
          fetch("/api/auth-debug", {
            cache: "no-store"
          })
        ]);

        const serverDiagnostics = (await serverDiagnosticsResponse.json()) as ServerAuthDiagnostics;

        if (isCancelled) {
          return;
        }

        setLiveServerDiagnostics(serverDiagnostics);
        setClientDiagnostics({
          timestamp: new Date().toISOString(),
          location: {
            href: window.location.href,
            host: window.location.host,
            origin: window.location.origin
          },
          cookies: {
            names: cookieNames,
            authCookieNames
          },
          auth: {
            user: userData.user
              ? {
                  id: userData.user.id,
                  email: userData.user.email ?? null
                }
              : null,
            userError: userError?.message ?? null,
            sessionUserId: sessionData.session?.user?.id ?? null,
            sessionExpiresAt: sessionData.session?.expires_at ?? null,
            sessionError: sessionError?.message ?? null
          }
        });
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load auth diagnostics.");
        }
      }
    }

    void loadDiagnostics();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="auth-debug-grid">
      <div className="auth-debug-notice detail-card">
        <h2>How to use this page</h2>
        <p>
          Open this page on desktop and in the installed app after signing in. If the server and
          browser disagree about the current user or auth cookie, that mismatch should show up
          below.
        </p>
        {loadError ? <p className="auth-debug-error">{loadError}</p> : null}
      </div>

      {renderJsonBlock("Server diagnostics", liveServerDiagnostics)}
      {renderJsonBlock("Browser diagnostics", clientDiagnostics)}
    </div>
  );
}
