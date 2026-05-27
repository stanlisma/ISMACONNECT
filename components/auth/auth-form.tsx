"use client";

import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { FieldHelp, FieldLabelWithHelp } from "@/components/ui/field-help";
import { trackMarketplaceEvent } from "@/lib/analytics";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  title: string;
  description?: string;
  helpText?: string;
  action: (formData: FormData) => Promise<void>;
}

export function AuthForm({ mode, title, description, helpText, action }: AuthFormProps) {
  const isSignUp = mode === "sign-up";

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="eyebrow">{isSignUp ? "Create Account" : "Welcome Back"}</span>

        <div className="auth-title-row">
          <h1>{title}</h1>
          {helpText ? <FieldHelp text={helpText} label={title} /> : null}
        </div>
        {description ? <p>{description}</p> : null}
        {isSignUp ? (
          <div className="auth-benefits" aria-label="Account benefits">
            <span className="auth-benefit-chip">Post rides, rentals, and services</span>
            <span className="auth-benefit-chip">Save searches and get alerts</span>
            <span className="auth-benefit-chip">Message locals faster</span>
            <span className="auth-benefit-chip">Create a storefront later</span>
          </div>
        ) : null}

        <form
          action={action}
          className="form-grid"
          onSubmit={() =>
            trackMarketplaceEvent(isSignUp ? "sign_up_attempt" : "sign_in_attempt", {
              surface: "auth"
            })
          }
        >
          {isSignUp ? (
            <>
              <div className="auth-field-grid">
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
              </div>

              <div className="auth-field-grid">
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
              </div>

              <div className="auth-field-grid">
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
              </div>

              <label className="field">
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
          )}

          <label className="field">
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

          <SubmitButton pendingLabel={isSignUp ? "Creating account..." : "Signing in..."}>
            {isSignUp ? "Create account" : "Sign in"}
          </SubmitButton>
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
