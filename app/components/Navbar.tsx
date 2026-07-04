"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/map", label: "Live Map" },
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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      style={{
        position: "relative",
        zIndex: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 22px",
        background: "rgba(30, 19, 22, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(217, 164, 91, 0.25)",
        boxShadow: "0 6px 30px rgba(0, 0, 0, 0.5)",
        flexWrap: "wrap",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.3rem" }}>🍇</span>
        <span className="cyber-title" style={{ fontSize: "1.25rem" }}>
          Kelowna GeoDASH
        </span>
      </Link>

      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: active ? "#2b1a0c" : "var(--text-mid)",
                background: active
                  ? "linear-gradient(92deg, var(--accent), #e8c37a)"
                  : "transparent",
                border: active
                  ? "1px solid var(--accent)"
                  : "1px solid transparent",
                boxShadow: active ? "0 0 16px rgba(217, 164, 91, 0.35)" : "none",
                transition: "all 0.2s ease",
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
                marginLeft: 8,
                padding: "4px 12px 4px 4px",
                borderRadius: 999,
                textDecoration: "none",
                border: "1px solid rgba(217, 164, 91, 0.35)",
                background: "rgba(217, 164, 91, 0.07)",
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
                    background: "#c94f4f",
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
              style={{ padding: "7px 14px", fontSize: "0.7rem" }}
            >
              Sign out
            </button>
          </>
        )}

        {loaded && !me && (
          <Link href="/login" style={{ textDecoration: "none", marginLeft: 8 }}>
            <span className="cyber-btn" style={{ padding: "8px 18px", fontSize: "0.72rem", display: "inline-block" }}>
              Sign In
            </span>
          </Link>
        )}

        <Link
          href="/admin"
          style={{
            marginLeft: 4,
            padding: "7px 10px",
            textDecoration: "none",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          Admin
        </Link>
      </div>
    </nav>
  );
}
