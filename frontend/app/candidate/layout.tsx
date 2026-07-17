import { PortalShell } from "@/components/portal-shell";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell kind="candidate">{children}</PortalShell>;
}
