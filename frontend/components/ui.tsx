import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes("reject") || normalized.includes("withdraw") || normalized.includes("closed")
      ? "danger"
      : normalized.includes("hire") ||
          normalized.includes("offer") ||
          normalized.includes("shortlist") ||
          normalized.includes("published")
        ? "success"
        : normalized.includes("interview") || normalized.includes("review")
          ? "warning"
          : "neutral";

  return <span className={`status status-${tone}`}>{value}</span>;
}

export function Feedback({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`feedback feedback-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loading-block" role="status">
      <LoaderCircle className="spin" size={22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {body ? <p>{body}</p> : null}
      </div>
      {action ? <div className="page-intro-action">{action}</div> : null}
    </header>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}
