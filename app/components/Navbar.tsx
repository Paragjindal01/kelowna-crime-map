"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/map", label: "Live Map" },
  { href: "/alerts", label: "Alerts" },
  { href: "/lost-found", label: "Lost & Found" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/report", label: "Report" },
];

type Me = {
  id: string;
  name: string;
  avatarColor: string;
  unreadNotifications: number;
  level: { level: number; name: string };
} | null;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, [pathname]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="site-nav">
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "var(--primary)",
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ◈
        </span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}>
          <span className="cyber-title" style={{ fontSize: "1.15rem", whiteSpace: "nowrap" }}>SafeKelowna</span>
          <span style={{ fontSize: "0.64rem", color: "var(--text-mid)", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
            Community Safety &amp; Local Alerts
          </span>
        </span>
      </Link>

      <button
        className="nav-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "9px 14px",
                borderRadius: 6,
                textDecoration: "none",
                fontSize: "0.84rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: active ? "#ffffff" : "var(--text-mid)",
                background: active ? "var(--primary)" : "transparent",
                border: active ? "1px solid var(--primary)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              {link.label}
            </Link>
          );
        })}

        {loaded && me && (
          <>
            <Link
              href="/dashboard"
              title="My dashboard"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px 4px 4px",
                borderRadius: 999,
                textDecoration: "none",
                border: "1px solid var(--glass-border)",
                background: "var(--bg-subtle)",
              }}
            >
              <span className="avatar" style={{ width: 30, height: 30, fontSize: "0.8rem", background: me.avatarColor }}>
                {me.name.charAt(0).toUpperCase()}
              </span>
              <span style={{ color: "var(--text-hi)", fontWeight: 600, fontSize: "0.85rem" }}>{me.name}</span>
              {me.unreadNotifications > 0 && (
                <span
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    minWidth: 20,
                    height: 20,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "var(--danger)",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {me.unreadNotifications}
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              className="cyber-btn cyber-btn--ghost"
              style={{ padding: "8px 14px", fontSize: "0.74rem" }}
            >
              Sign out
            </button>
          </>
        )}

        {loaded && !me && (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <span className="cyber-btn" style={{ padding: "9px 18px", fontSize: "0.76rem", display: "inline-block", width: "100%", textAlign: "center", boxSizing: "border-box" }}>
              Sign In
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
