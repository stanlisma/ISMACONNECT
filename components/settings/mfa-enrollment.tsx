"use client";

import { useEffect, useState } from "react";

import { FlashMessage } from "@/components/ui/flash-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type MfaState =
  | { status: "loading" }
  | { status: "unenrolled" }
  | { status: "enrolling"; factorId: string; qrCode: string; secret: string; code: string }
  | { status: "enrolled"; factorId: string };

export function MfaEnrollment() {
  const [state, setState] = useState<MfaState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFactors() {
      const supabase = createBrowserSupabaseClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (listError) {
        setError(listError.message);
        setState({ status: "unenrolled" });
        return;
      }

      const verifiedTotp = data.totp.find((factor) => factor.status === "verified");
      setState(verifiedTotp ? { status: "enrolled", factorId: verifiedTotp.id } : { status: "unenrolled" });
    }

    loadFactors();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startEnrollment() {
    setError(null);
    setBusy(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });

    setBusy(false);

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Could not start two-factor setup.");
      return;
    }

    setState({
      status: "enrolling",
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      code: ""
    });
  }

  async function verifyEnrollment() {
    if (state.status !== "enrolling") return;

    setError(null);
    setBusy(true);

    const supabase = createBrowserSupabaseClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: state.factorId
    });

    if (challengeError || !challenge) {
      setBusy(false);
      setError(challengeError?.message ?? "Could not verify that code.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: state.factorId,
      challengeId: challenge.id,
      code: state.code.trim()
    });

    setBusy(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setState({ status: "enrolled", factorId: state.factorId });
  }

  async function cancelEnrollment() {
    if (state.status !== "enrolling") return;

    const supabase = createBrowserSupabaseClient();
    await supabase.auth.mfa.unenroll({ factorId: state.factorId });
    setError(null);
    setState({ status: "unenrolled" });
  }

  async function disableMfa() {
    if (state.status !== "enrolled") return;

    if (typeof window !== "undefined" && !window.confirm("Turn off two-factor authentication for this account?")) {
      return;
    }

    setError(null);
    setBusy(true);

    const supabase = createBrowserSupabaseClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: state.factorId });

    setBusy(false);

    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }

    setState({ status: "unenrolled" });
  }

  if (state.status === "loading") {
    return <p className="browser-notification-note">Checking two-factor status...</p>;
  }

  return (
    <div className="settings-block-stack">
      <FlashMessage tone="error" message={error ?? undefined} />

      {state.status === "unenrolled" ? (
        <>
          <p className="browser-notification-note">
            Two-factor authentication is off. Turning it on requires an authenticator app (like Google
            Authenticator or Authy) at sign-in, in addition to your password.
          </p>
          <button className="button" type="button" onClick={startEnrollment} disabled={busy}>
            {busy ? "Starting..." : "Enable two-factor authentication"}
          </button>
        </>
      ) : null}

      {state.status === "enrolling" ? (
        <>
          <p className="browser-notification-note">
            Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
          </p>
          <img
            src={state.qrCode}
            alt="Two-factor authentication QR code"
            style={{ width: "180px", height: "180px" }}
          />
          <p className="browser-notification-note">
            Can't scan it? Enter this key manually: <code>{state.secret}</code>
          </p>
          <label className="field">
            <span className="field-label">6-digit code</span>
            <input
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={state.code}
              onChange={(event) => setState({ ...state, code: event.target.value })}
            />
          </label>
          <div className="action-row">
            <button className="button" type="button" onClick={verifyEnrollment} disabled={busy || state.code.trim().length !== 6}>
              {busy ? "Verifying..." : "Verify and enable"}
            </button>
            <button className="button button-ghost" type="button" onClick={cancelEnrollment} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      ) : null}

      {state.status === "enrolled" ? (
        <>
          <p className="browser-notification-note">
            Two-factor authentication is on. You'll be asked for a code from your authenticator app each time you
            sign in.
          </p>
          <button className="button button-ghost button-danger" type="button" onClick={disableMfa} disabled={busy}>
            {busy ? "Turning off..." : "Turn off two-factor authentication"}
          </button>
        </>
      ) : null}
    </div>
  );
}
