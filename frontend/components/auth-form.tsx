"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Feedback } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: {
            full_name: String(form.get("full_name") || ""),
            email,
            password,
          },
        });
        const verification = await api<{ verification_token?: string; message: string }>(
          "/auth/request-verification",
          { method: "POST", body: { email } },
        );
        setVerificationToken(verification.verification_token || "");
        setSuccess(
          verification.verification_token
            ? "Account created. Verify it below to continue in development."
            : "Account created. Check your email for the verification link.",
        );
      } else {
        const user = await login(email, password);
        const next = searchParams.get("next");
        router.push(next || (user.role === "candidate" ? "/candidate" : "/admin"));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError("");
    try {
      await api("/auth/verify-email", {
        method: "POST",
        body: { token: verificationToken },
      });
      setSuccess("Email verified. You can now sign in.");
      setVerificationToken("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <span className="auth-icon"><ShieldCheck size={22} /></span>
        <h1>{mode === "login" ? "Welcome back" : "Create your candidate profile"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to track applications or manage hiring."
            : "Keep your profile, resume, and applications in one place."}
        </p>
      </div>
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}
      <form className="form-stack" onSubmit={submit}>
        {mode === "register" ? (
          <label>
            <span>Full name</span>
            <input name="full_name" autoComplete="name" required />
          </label>
        ) : null}
        <label>
          <span>Email address</span>
          <div className="input-with-icon">
            <Mail size={18} aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" required />
          </div>
        </label>
        <label>
          <span>Password</span>
          <div className="input-with-icon">
            <button
              type="button"
              className="input-icon-button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </div>
          {mode === "register" ? (
            <small>Use at least 8 characters with one letter and one number.</small>
          ) : null}
        </label>
        <button className="button button-primary button-wide" disabled={loading}>
          {loading ? "Please wait" : mode === "login" ? "Sign in" : "Create profile"}
        </button>
      </form>
      {verificationToken ? (
        <div className="dev-verification">
          <label>
            <span>Development verification token</span>
            <textarea
              value={verificationToken}
              onChange={(event) => setVerificationToken(event.target.value)}
              rows={3}
            />
          </label>
          <button className="button button-secondary button-wide" onClick={verify} disabled={loading}>
            Verify email
          </button>
        </div>
      ) : null}
      <div className="auth-foot">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password">Forgot password?</Link>
            <span>New here? <Link href="/register">Create profile</Link></span>
          </>
        ) : (
          <span>Already registered? <Link href="/login">Sign in</Link></span>
        )}
      </div>
    </div>
  );
}
