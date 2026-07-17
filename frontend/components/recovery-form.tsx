"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Feedback } from "@/components/ui";

export function RecoveryForm() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<{ message: string; reset_token?: string }>(
        "/auth/forgot-password",
        { method: "POST", body: { email: form.get("email") } },
      );
      setMessage(response.message);
      setToken(response.reset_token || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: { token, password: form.get("password") },
      });
      setMessage(response.message);
      setToken("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <h1>Reset your password</h1>
        <p>Request a time-limited reset link for your Pravaron Technologies Careers account.</p>
      </div>
      {message ? <Feedback tone="success">{message}</Feedback> : null}
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {!token ? (
        <form className="form-stack" onSubmit={requestReset}>
          <label>
            <span>Email address</span>
            <input type="email" name="email" required />
          </label>
          <button className="button button-primary button-wide" disabled={loading}>
            Request reset
          </button>
        </form>
      ) : (
        <form className="form-stack" onSubmit={resetPassword}>
          <label>
            <span>Development reset token</span>
            <textarea value={token} onChange={(event) => setToken(event.target.value)} rows={3} />
          </label>
          <label>
            <span>New password</span>
            <input type="password" name="password" minLength={8} required />
          </label>
          <button className="button button-primary button-wide" disabled={loading}>
            Set new password
          </button>
        </form>
      )}
    </div>
  );
}
