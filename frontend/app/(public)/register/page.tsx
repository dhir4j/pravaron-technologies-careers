import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <div className="auth-aside register-aside">
        <video autoPlay loop muted playsInline aria-hidden="true">
          <source src="/assets/website-header-animation.mp4" type="video/mp4" />
        </video>
        <div className="auth-video-overlay" />
        <div>
          <p className="eyebrow">For applicants</p>
          <h2>Create your profile and apply to Pravaron Technologies.</h2>
        </div>
      </div>
      <Suspense fallback={<div className="auth-card">Loading registration</div>}>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
