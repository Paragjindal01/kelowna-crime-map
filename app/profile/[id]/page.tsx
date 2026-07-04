"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Profile = {
  id: string;
  name: string;
  avatarColor: string;
  xp: number;
  verified?: boolean;
  joinedAt: string;
  level: { level: number; name: string; progress: number; nextLevel: { minXp: number; name: string } | null };
  stats: { approvedReports: number; itemsPosted: number; itemsReturnedToOthers: number; itemsRecovered: number };
  achievements: { key: string; label: string; icon: string; earned: boolean }[];
} | null;

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Not found");
        setProfile(data);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main style={{ height: "100%", display: "grid", placeItems: "center" }}>
        <div style={{ color: "var(--text-mid)" }}>⚠ {error}</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-mid)" }}>
        Loading profile…
      </main>
    );
  }

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "40px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="glass-panel" style={{ padding: 30, textAlign: "center" }}>
          <span className="avatar" style={{ width: 76, height: 76, fontSize: "2rem", margin: "0 auto 14px", background: profile.avatarColor }}>
            {profile.name.charAt(0).toUpperCase()}
          </span>
          <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.7rem" }}>
            {profile.name}
            {profile.verified && (
              <span title="Verified member" style={{ color: "var(--vine)", marginLeft: 8, fontSize: "0.7em", WebkitTextFillColor: "var(--vine)" }}>✓</span>
            )}
          </h1>
          <div style={{ color: "var(--text-dim)", marginTop: 6, fontSize: "0.85rem" }}>
            Joined {new Date(profile.joinedAt).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <span className="level-badge">Lv.{profile.level.level} · {profile.level.name}</span>
          </div>

          <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
            <div className="xp-bar"><div style={{ width: `${profile.level.progress}%` }} /></div>
            <div style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--text-dim)" }}>
              {profile.xp} XP{profile.level.nextLevel ? ` · ${profile.level.nextLevel.minXp - profile.xp} to ${profile.level.nextLevel.name}` : " · Max level"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginTop: 20 }}>
          {[
            { label: "Reports Approved", value: profile.stats.approvedReports },
            { label: "Items Posted", value: profile.stats.itemsPosted },
            { label: "Items Recovered", value: profile.stats.itemsRecovered },
            { label: "Helped Return", value: profile.stats.itemsReturnedToOthers },
          ].map((s) => (
            <div key={s.label} className="hud-card" style={{ textAlign: "center", padding: 18 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
              <div className="cyber-label" style={{ marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
          <div className="cyber-sub" style={{ marginBottom: 16 }}>Achievements</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {profile.achievements.map((a) => (
              <div
                key={a.key}
                style={{
                  textAlign: "center",
                  padding: "16px 10px",
                  borderRadius: 12,
                  border: `1px solid ${a.earned ? "rgba(217,164,91,0.4)" : "rgba(217,164,91,0.1)"}`,
                  background: a.earned ? "rgba(217,164,91,0.08)" : "transparent",
                  opacity: a.earned ? 1 : 0.4,
                }}
              >
                <div style={{ fontSize: "1.8rem" }}>{a.icon}</div>
                <div style={{ fontSize: "0.78rem", marginTop: 8, color: "var(--text-hi)", fontWeight: 600 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
