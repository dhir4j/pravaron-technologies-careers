"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

const publicLinks = [
  { href: "/", label: "Careers" },
  { href: "/jobs", label: "Open roles" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboardHref =
    user?.role === "candidate" ? "/candidate" : user ? "/admin" : "/login";

  async function signOut() {
    await logout();
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="wordmark" href="/" aria-label="Pravaron Technologies Careers home">
          <span className="wordmark-mark" aria-hidden="true">
            <Image src="/images/pravaron-mark.png" alt="" width={54} height={47} priority />
          </span>
          <span className="wordmark-copy">
            <strong>Pravaron</strong>
            <small>Technologies · Careers</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {publicLinks.map((item) => (
            <Link
              className={pathname === item.href ? "active" : ""}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link className="button button-secondary button-small" href={dashboardHref}>
                <BriefcaseBusiness size={17} aria-hidden="true" />
                Dashboard
              </Link>
              <button className="button button-ghost button-small desktop-only" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="button button-ghost button-small desktop-only" href="/login">
                Sign in
              </Link>
              <Link className="button button-primary button-small" href="/register">
                Create profile
              </Link>
            </>
          )}
          <button
            className="icon-button mobile-menu-button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {publicLinks.map((item) => (
            <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href={dashboardHref} onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <button onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="footer-wordmark" href="/" aria-label="Pravaron Technologies Careers home">
            <span className="footer-wordmark-mark" aria-hidden="true">
              <Image src="/images/pravaron-mark.png" alt="" width={50} height={44} />
            </span>
            <span className="footer-wordmark-copy">
              <strong>Pravaron</strong>
              <small>Technologies · Careers</small>
            </span>
          </Link>
          <p>
            Build agentic AI, automation platforms, and intelligent systems that make business operations more autonomous.
          </p>
          <p className="footer-address">O-621, Block-A, EON Fairfox, Sector-140A, Noida.</p>
          <a className="footer-email" href="mailto:careers@pravarontechnologies.com">
            careers@pravarontechnologies.com
          </a>
        </div>
        <div>
          <span>Careers</span>
          <Link href="/jobs">Open roles</Link>
          <Link href="/jobs?type=Internship">Internships</Link>
        </div>
        <div>
          <span>Company</span>
          <a href="https://www.pravarontechnologies.com/about">About</a>
          <a href="https://www.pravarontechnologies.com/services">Services</a>
          <a href="https://www.pravarontechnologies.com/contact">Contact</a>
        </div>
      </div>
      <div className="footer-base">
        <span>© 2026 Pravaron Technologies Pvt. Ltd.</span>
        <span>Noida, India</span>
      </div>
    </footer>
  );
}
