"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function OkanaganScene() {
  const ref = useRef<HTMLDivElement>(null);

  // gentle parallax on scroll
  useEffect(() => {
    const scroller = ref.current?.closest("main");
    if (!scroller) return;
    const onScroll = () => {
      const y = (scroller as HTMLElement).scrollTop;
      if (!ref.current) return;
      ref.current.querySelectorAll<SVGGElement>("[data-depth]").forEach((layer) => {
        const depth = Number(layer.dataset.depth);
        layer.style.transform = `translateY(${y * depth}px)`;
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="hero-scene" ref={ref}>
      <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c0f16" />
            <stop offset="45%" stopColor="#4a2135" />
            <stop offset="78%" stopColor="#8c3f47" />
            <stop offset="100%" stopColor="#c96f4a" />
          </linearGradient>
          <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9784f" stopOpacity="0.75" />
            <stop offset="30%" stopColor="#7a3a44" />
            <stop offset="100%" stopColor="#2a151c" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#f3d9a0" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#e8b25f" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e8b25f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sky */}
        <rect width="1440" height="800" fill="url(#sky)" />

        {/* sun */}
        <g data-depth="0.18">
          <circle cx="1020" cy="430" r="190" fill="url(#sunGlow)">
            <animate attributeName="r" values="185;205;185" dur="7s" repeatCount="indefinite" />
          </circle>
          <circle cx="1020" cy="430" r="58" fill="#f3dba6" opacity="0.95" />
        </g>

        {/* far hills */}
        <g data-depth="0.12">
          <path d="M0 500 Q 200 400 430 470 T 900 450 T 1440 480 V 800 H 0 Z" fill="#3a1e2c" opacity="0.9" />
        </g>

        {/* lake */}
        <g data-depth="0.08">
          <rect x="0" y="500" width="1440" height="300" fill="url(#lake)" />
          {/* sun reflection */}
          <g opacity="0.5">
            <rect x="960" y="516" width="120" height="5" rx="2.5" fill="#f3d9a0">
              <animate attributeName="width" values="120;90;120" dur="4s" repeatCount="indefinite" />
            </rect>
            <rect x="975" y="536" width="90" height="4" rx="2" fill="#eec27f">
              <animate attributeName="width" values="90;130;90" dur="5s" repeatCount="indefinite" />
            </rect>
            <rect x="990" y="556" width="66" height="3.5" rx="1.75" fill="#e8b25f">
              <animate attributeName="width" values="66;44;66" dur="3.5s" repeatCount="indefinite" />
            </rect>
          </g>
        </g>

        {/* near vineyard hill */}
        <g data-depth="0.04">
          <path d="M0 640 Q 360 540 760 620 T 1440 660 V 800 H 0 Z" fill="#241318" />
          {/* vineyard rows */}
          <g stroke="#7fa35c" strokeWidth="2.5" opacity="0.5" strokeLinecap="round">
            <path d="M40 800 Q 300 660 560 648" fill="none" />
            <path d="M180 800 Q 400 680 640 660" fill="none" />
            <path d="M330 800 Q 500 700 720 676" fill="none" />
            <path d="M490 800 Q 620 716 820 694" fill="none" />
            <path d="M660 800 Q 760 730 930 712" fill="none" />
            <path d="M840 800 Q 920 748 1060 732" fill="none" />
            <path d="M1030 800 Q 1090 764 1210 752" fill="none" />
            <path d="M1230 800 Q 1270 780 1380 770" fill="none" />
          </g>
          {/* grape clusters */}
          <g className="grape">
            <circle cx="300" cy="672" r="5" fill="#a04a68" />
            <circle cx="309" cy="678" r="5" fill="#8c3b5d" />
            <circle cx="295" cy="682" r="5" fill="#6e2e46" />
            <circle cx="304" cy="688" r="4.5" fill="#a04a68" />
          </g>
          <g className="grape" style={{ animationDelay: "1.4s" }}>
            <circle cx="700" cy="700" r="5" fill="#a04a68" />
            <circle cx="709" cy="706" r="5" fill="#8c3b5d" />
            <circle cx="695" cy="710" r="5" fill="#6e2e46" />
          </g>
          <g className="grape" style={{ animationDelay: "2.6s" }}>
            <circle cx="1080" cy="742" r="4.5" fill="#a04a68" />
            <circle cx="1088" cy="747" r="4.5" fill="#8c3b5d" />
            <circle cx="1076" cy="751" r="4.5" fill="#6e2e46" />
          </g>
        </g>

        {/* bottom fade into page background */}
        <rect x="0" y="720" width="1440" height="80" fill="#191014" opacity="0.55" />
        <rect x="0" y="760" width="1440" height="40" fill="#191014" opacity="0.85" />
      </svg>
    </div>
  );
}

type Totals = { members: number; approvedReports: number; itemsReturned: number } | null;

export default function Landing() {
  useReveal();
  const [totals, setTotals] = useState<Totals>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setTotals(d.totals ?? null))
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: "🗺️",
      title: "Live Safety Map",
      body: "Verified incident reports across Kelowna on an interactive map — filter by type and time, see camera locations.",
      href: "/map",
      cta: "Open the map",
    },
    {
      icon: "🧺",
      title: "Lost & Found",
      body: "Lost something at the beach, a winery, or downtown? Post it. Found something? Return it and earn community reputation.",
      href: "/lost-found",
      cta: "Browse items",
    },
    {
      icon: "🏆",
      title: "Community Reputation",
      body: "Every approved report and returned item earns reputation. Climb the ranks on the community leaderboard.",
      href: "/leaderboard",
      cta: "See leaderboard",
    },
  ];

  const steps = [
    { n: "01", title: "Create an account", body: "Join the community in seconds — free for everyone in the Okanagan." },
    { n: "02", title: "Report or post", body: "Submit a safety report or list a lost item with a photo." },
    { n: "03", title: "Admin review", body: "Every submission is verified by moderators before going public." },
    { n: "04", title: "Reunite & earn", body: "Neighbours respond through private messages. Returns earn XP and badges." },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <OkanaganScene />
        <div className="hero-content">
          <div className="cyber-sub" style={{ marginBottom: 18 }}>
            Community Safety &amp; Local Alerts
          </div>
          <h1 className="hero-title">
            SafeKelowna
          </h1>
          <p className="hero-tag">
            An independent community safety platform for Kelowna and the Central Okanagan — a public
            safety map, local alerts, and lost &amp; found, kept up to date by neighbours.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
            <Link href="/map" style={{ textDecoration: "none" }}>
              <span className="cyber-btn" style={{ display: "inline-block" }}>Explore the live map</span>
            </Link>
            <Link href="/lost-found" style={{ textDecoration: "none" }}>
              <span className="cyber-btn cyber-btn--wine" style={{ display: "inline-block" }}>Lost &amp; Found</span>
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "34px 24px 10px" }}>
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[
            { label: "Community members", value: totals?.members },
            { label: "Verified reports", value: totals?.approvedReports },
            { label: "Items returned", value: totals?.itemsReturned },
          ].map((s) => (
            <div key={s.label} className="hud-card" style={{ textAlign: "center", padding: 22 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                }}
              >
                {s.value ?? "—"}
              </div>
              <div className="cyber-label" style={{ marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={f.title} className="glass-panel reveal" style={{ padding: 28, transitionDelay: `${i * 0.12}s` }}>
              <div style={{ fontSize: "2.2rem" }}>{f.icon}</div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                  margin: "14px 0 10px",
                  color: "var(--text-hi)",
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: "var(--text-mid)", lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              <Link href={f.href} style={{ textDecoration: "none" }}>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 18,
                    color: "var(--accent)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {f.cta} →
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 24px 56px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 34 }}>
          <div className="cyber-sub">How it works</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "12px 0 0", color: "var(--text-hi)" }}>
            From the community, for the community
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {steps.map((s, i) => (
            <div key={s.n} className="hud-card reveal" style={{ padding: 22, transitionDelay: `${i * 0.1}s` }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  color: "var(--wine)",
                }}
              >
                {s.n}
              </div>
              <div style={{ fontWeight: 700, margin: "10px 0 6px", color: "var(--text-hi)" }}>{s.title}</div>
              <div style={{ color: "var(--text-mid)", fontSize: "0.92rem", lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* JOIN CTA */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 70px" }}>
        <div
          className="glass-panel reveal"
          style={{
            padding: "44px 32px",
            textAlign: "center",
            background:
              "linear-gradient(140deg, rgba(110, 46, 70, 0.45), rgba(38, 24, 28, 0.85) 60%), var(--bg-panel)",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.1rem", margin: 0 }} className="cyber-title">
            Join the neighbourhood watch, Okanagan style
          </h2>
          <p style={{ color: "var(--text-mid)", maxWidth: 520, margin: "16px auto 26px", lineHeight: 1.65 }}>
            Earn reputation for every verified report and every item you help return. Kelowna looks
            out for its own.
          </p>
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <span className="cyber-btn" style={{ display: "inline-block" }}>Create free account</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(217, 164, 91, 0.15)",
          padding: "26px 24px 34px",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: "0.82rem",
          lineHeight: 1.6,
        }}
      >
        <b style={{ color: "var(--text-mid)" }}>Disclaimer:</b> SafeKelowna is an independent
        community safety platform and is not affiliated with the RCMP, City of Kelowna, or any
        government agency. Always call 911 in emergencies. Incident locations may be approximate.
      </footer>
    </div>
  );
}
