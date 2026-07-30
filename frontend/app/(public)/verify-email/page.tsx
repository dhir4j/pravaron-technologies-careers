"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2, Mail } from "lucide-react";
import { CAREERS_CONTACT_EMAIL } from "@/lib/contact";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("No verification token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/v1/auth/verify-email?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified!");
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred while verifying your email. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="auth-page single-auth">
      <div className="auth-card">
        <div className="auth-card-heading">
          {status === "loading" && (
            <>
              <div className="auth-icon">
                <Loader2 className="spin" size={24} />
              </div>
              <h1>Verifying your email...</h1>
              <p>Please wait while we verify your email address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="auth-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
                <Check size={24} />
              </div>
              <h1>Email verified!</h1>
              <p>{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="auth-icon" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                <X size={24} />
              </div>
              <h1>Verification failed</h1>
              <p>{message}</p>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="auth-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
                <Mail size={24} />
              </div>
              <h1>Invalid verification link</h1>
              <p>{message}</p>
            </>
          )}
        </div>

        {status === "success" && (
          <div className="form-stack">
            <Link href="/candidate" className="button button-primary button-wide">
              Go to Dashboard
            </Link>
            <Link href="/jobs" className="button button-secondary button-wide">
              Browse Open Roles
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="form-stack">
            <Link href="/login" className="button button-primary button-wide">
              Back to Login
            </Link>
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              Need help? Contact us at{" "}
              <a href={`mailto:${CAREERS_CONTACT_EMAIL}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
                {CAREERS_CONTACT_EMAIL}
              </a>
            </p>
          </div>
        )}

        {status === "invalid" && (
          <div className="form-stack">
            <Link href="/register" className="button button-primary button-wide">
              Create Account
            </Link>
            <Link href="/login" className="button button-secondary button-wide">
              Login Instead
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <main className="auth-page single-auth">
        <div className="auth-card">
          <div className="auth-icon"><Loader2 className="spin" size={24} /></div>
          <h1>Loading…</h1>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
