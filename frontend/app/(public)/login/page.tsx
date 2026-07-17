import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <div>
          <p className="eyebrow">Applicant portal</p>
          <h2>Your applications, updates, and next steps in one place.</h2>
        </div>
      </div>
      <Suspense fallback={<div className="auth-card">Loading sign in</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
