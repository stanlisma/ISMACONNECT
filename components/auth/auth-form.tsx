"use client";

import { useState } from "react";
import Link from "next/link";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { trackMarketplaceEvent } from "@/lib/analytics";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  title: string;
  description?: string;
  helpText?: string;
  action?: (formData: FormData) => Promise<void>;
}

function formatClientAuthError(message: string) {
  const normalizedMessage = message.trim().toLowerCase();

  if (normalizedMessage.includes("rate limit")) {
    return "Too many sign-in attempts were made from this device or network. Wait a few minutes, then try again once.";
  }

  return message;
}

export function AuthForm({ mode, title, description, helpText, action }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [clientError, setClientError] = useState<string | undefined>();
  const [clientSuccess, setClientSuccess] = useState<string | undefined>();
  const [clientPending, setClientPending] = useState(false);

  async function handleSignInSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(undefined);
    setClientSuccess(undefined);
    setClientPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setClientError(formatClientAuthError(error.message));
        return;
      }

      window.location.replace("/browse");
    } catch (error) {
      setClientError(
        error instanceof Error ? error.message : "Unable to sign in right now. Please try again."
      );
    } finally {
      setClientPending(false);
    }
  }

  async function handleMagicLinkSignIn() {
    setClientError(undefined);
    setClientSuccess(undefined);
    setClientPending(true);

    try {
      const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
      const email = emailInput?.value.trim() ?? "";

      if (!email) {
        setClientError("Enter your email first, then request a sign-in link.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/browse`
        }
      });

      if (error) {
        setClientError(formatClientAuthError(error.message));
        return;
      }

      setClientSuccess("Check your email for a sign-in link. Open it on this device to continue.");
    } catch (error) {
      setClientError(
        error instanceof Error ? error.message : "Unable to send a sign-in link right now."
      );
    } finally {
      setClientPending(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header-row">
          <span className="eyebrow">{isSignUp ? "Create Account" : "Welcome Back"}</span>
          {isSignUp && helpText ? <FieldHelp text={helpText} label={title} /> : null}
        </div>

        {isSignUp ? (
          <h1 className="sr-only">{title}</h1>
        ) : (
          <div className="auth-title-row">
            <h1>{title}</h1>
            {helpText ? <FieldHelp text={helpText} label={title} /> : null}
          </div>
        )}

        {!isSignUp && description ? <p>{description}</p> : null}

        {!isSignUp ? <FlashMessage message={clientError} tone="error" /> : null}
        {!isSignUp ? <FlashMessage message={clientSuccess} tone="success" /> : null}

        <form
          action={isSignUp ? action : undefined}
          className="form-grid auth-form-grid"
          onSubmit={async (event) => {
            trackMarketplaceEvent(isSignUp ? "sign_up_attempt" : "sign_in_attempt", {
              surface: "auth"
            });

            if (!isSignUp) {
              await handleSignInSubmit(event);
            }
          }}
        >
          {isSignUp ? (
            <>
              <label className="field">
                <span className="field-label">First name</span>
                <input
                  autoComplete="given-name"
                  className="input"
                  name="firstName"
                  placeholder="First name"
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Last name</span>
                <input
                  autoComplete="family-name"
                  className="input"
                  name="lastName"
                  placeholder="Last name"
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Email</span>
                <input
                  autoComplete="email"
                  className="input"
                  name="email"
                  placeholder="name@example.com"
                  required
                  type="email"
                />
              </label>

              <label className="field">
                <span className="field-label">Confirm email</span>
                <input
                  autoComplete="email"
                  className="input"
                  name="confirmEmail"
                  placeholder="Re-enter your email"
                  required
                  type="email"
                />
              </label>

              <label className="field">
                <FieldLabelWithHelp
                  label="Phone number"
                  helpText="Use the number you want tied to listing replies. We will save whether you prefer text or voice verification for this account."
                />
                <input
                  autoComplete="tel"
                  className="input"
                  name="phone"
                  placeholder="780-555-0123"
                  required
                  type="tel"
                />
              </label>

              <label className="field">
                <FieldLabelWithHelp
                  label="Verify phone by"
                  helpText="Choose whether this phone should be verified by text message or a voice call when phone verification is enabled for your account."
                />
                <select
                  className="select"
                  name="phoneVerificationMethod"
                  defaultValue="text"
                  required
                >
                  <option value="text">Text message</option>
                  <option value="call">Voice call</option>
                </select>
              </label>

              <label className="field field-full">
                <FieldLabelWithHelp
                  label="Address"
                  helpText="Use your usual Fort McMurray area address or community so your account starts with a real local profile."
                />
                <input
                  autoComplete="street-address"
                  className="input"
                  name="address"
                  placeholder="Thickwood, Fort McMurray"
                  required
                />
              </label>
            </>
          ) : (
            <label className="field field-full">
              <span className="field-label">Email</span>
              <input
                autoComplete="email"
                className="input"
                name="email"
                placeholder="name@example.com"
                required
                type="email"
              />
            </label>
          )}

          <label className={`field${isSignUp ? "" : " field-full"}`}>
            <span className="field-label">Password</span>
            <input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="input"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </label>

          {isSignUp ? (
            <label className="field">
              <span className="field-label">Confirm password</span>
              <input
                autoComplete="new-password"
                className="input"
                minLength={8}
                name="confirmPassword"
                placeholder="Re-enter your password"
                required
                type="password"
              />
            </label>
          ) : null}

          <SubmitButton
            className={isSignUp ? "auth-submit-button field-full" : "field-full"}
            forcePending={!isSignUp && clientPending}
            pendingLabel={isSignUp ? "Creating account..." : "Signing in..."}
          >
            {isSignUp ? "Create account" : "Sign in"}
          </SubmitButton>

          {!isSignUp ? (
            <button
              className="button button-secondary field-full"
              disabled={clientPending}
              onClick={handleMagicLinkSignIn}
              type="button"
            >
              Email me a sign-in link
            </button>
          ) : null}
        </form>

        {isSignUp ? (
          <p className="auth-next-step">
            Confirm your email, then you can browse, post, save searches, message locals, and open storefronts from the same account.
          </p>
        ) : null}

        {!isSignUp ? (
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/auth/forgot-password" className="button button-secondary">
              Forgot your password?
            </Link>
          </div>
        ) : null}

        <p className="auth-footer">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>

        <p className="auth-footer">
          By continuing, you agree to the <Link href="/terms">Terms of Use</Link> and acknowledge the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
