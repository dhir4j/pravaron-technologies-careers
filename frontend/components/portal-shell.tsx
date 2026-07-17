"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoadingBlock } from "@/components/ui";

const candidateItems = [
  { href: "/candidate", label: "Overview", icon: LayoutDashboard },
  { href: "/candidate/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/candidate/profile", label: "Profile", icon: UserRound },
  { href: "/candidate/notifications", label: "Notifications", icon: Bell },
  { href: "/candidate/settings", label: "Settings", icon: Settings },
];

const adminItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/candidates", label: "Candidates", icon: UsersRound },
  { href: "/admin/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/admin/templates", label: "Email templates", icon: Mail },
  { href: "/admin/users", label: "Team access", icon: UserRound },
];

export function PortalShell({
  kind,
  children,
}: {
  kind: "candidate" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const items = kind === "candidate" ? candidateItems : adminItems;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (kind === "candidate" && user.role !== "candidate") router.replace("/admin");
    if (kind === "admin" && user.role === "candidate") router.replace("/candidate");
  }, [kind, loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <main className="portal-loading">
        <LoadingBlock label="Opening your workspace" />
      </main>
    );
  }

  return (
    <div className="portal">
      <aside className="portal-sidebar">
        <Link className="portal-brand" href="/">
          <span>P</span>
          <strong>Pravaron Technologies Careers</strong>
        </Link>
        <div className="portal-user">
          <strong>{user.full_name}</strong>
          <span>{kind === "candidate" ? "Candidate" : "Hiring team"}</span>
        </div>
        <nav aria-label={`${kind} navigation`}>
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === pathname || (href !== `/${kind}` && pathname.startsWith(href));
            return (
              <Link className={active ? "active" : ""} href={href} key={href}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          className="portal-signout"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </aside>
      <div className="portal-content">{children}</div>
    </div>
  );
}
