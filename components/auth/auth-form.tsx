import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
}

export function AuthForm({ mode, title, description, action }: AuthFormProps) {
  const isSignUp = mode === "sign-up";

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="eyebrow">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </span>

        <h1>{title}</h1>
        <p>{description}</p>

        <form action={action} className="form-grid">
          {isSignUp && (
            <label className="field">
              <span className="field-label">Full name</span>
              <input
                className="input"
                name="fullName"
                placeholder="Your full name"
                required
              />
            </label>
          )}

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

          <SubmitButton
            pendingLabel={isSignUp ? "Creating account..." : "Signing in..."}
          >
            {isSignUp ? "Create account" : "Sign in"}
          </SubmitButton>
        </form>

        {/* 🔥 Forgot Password (only for sign-in) */}
        {!isSignUp && (
          <p style={{ marginTop: "0.75rem", textAlign: "center" }}>
            <Link href="/auth/forgot-password">
              Forgot your password?
            </Link>
          </p>
        )}

        {/* Footer */}
        <p className="auth-footer">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  );
}