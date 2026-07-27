"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FlashMessage } from "@/components/ui/flash-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function MfaChallengeForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFactor() {
      const supabase = createBrowserSupabaseClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (listError || !data.totp.length) {
        setError(listError?.message ?? "No two-factor method is set up on this account.");
        return;
      }

      setFactorId(data.totp[0].id);
    }

    loadFactor();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!factorId) return;

    setError(null);
    setBusy(true);

    const supabase = createBrowserSupabaseClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim()
    });

    setBusy(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="stack-md">
      <FlashMessage tone="error" message={error ?? undefined} />

      <label className="field">
        <span className="field-label">6-digit code</span>
        <input
          className="input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </label>

      <button className="button" type="submit" disabled={busy || !factorId || code.trim().length !== 6}>
        {busy ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
