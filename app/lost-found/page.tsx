"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  { value: "electronics", label: "Electronics", emoji: "📱" },
  { value: "wallet_id", label: "Wallet / ID", emoji: "👛" },
  { value: "keys", label: "Keys", emoji: "🔑" },
  { value: "jewelry", label: "Jewelry", emoji: "💍" },
  { value: "clothing", label: "Clothing", emoji: "🧥" },
  { value: "pet", label: "Pet", emoji: "🐕" },
  { value: "bike", label: "Bike", emoji: "🚲" },
  { value: "other", label: "Other", emoji: "📦" },
];

const catEmoji = (v: string) => CATEGORIES.find((c) => c.value === v)?.emoji ?? "📦";
const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? "Other";

type Item = {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  location: string;
  dateLost: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  status: "lost" | "found" | "returned";
  moderation?: string;
  owner?: { id: string; name: string; verified?: boolean; level: { level: number; name: string } } | null;
  ownerId?: string | null;
};

type Me = { id: string; name: string } | null;

type CommentT = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; avatarColor: string };
};

function Comments({ itemId, me }: { itemId: string; me: Me }) {
  const [comments, setComments] = useState<CommentT[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch(`/api/comments?targetType=lost_item&targetId=${itemId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const post = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "lost_item", targetId: itemId, body: text }),
    });
    setText("");
    setBusy(false);
    load();
  };

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid rgba(217,164,91,0.15)", paddingTop: 10 }}>
      {comments.map((c) => (
        <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
          <span className="avatar" style={{ width: 24, height: 24, fontSize: "0.65rem", background: c.user.avatarColor }}>
            {c.user.name.charAt(0).toUpperCase()}
          </span>
          <div style={{ fontSize: "0.85rem", lineHeight: 1.45 }}>
            <span style={{ fontWeight: 600, color: "var(--accent)" }}>{c.user.name}</span>{" "}
            <span style={{ color: "var(--text-mid)" }}>{c.body}</span>
          </div>
        </div>
      ))}
      {comments.length === 0 && (
        <div style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>No comments yet.</div>
      )}
      {me ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            className="cyber-input"
            style={{ padding: "8px 10px", fontSize: "0.85rem" }}
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && post()}
          />
          <button className="cyber-btn" style={{ padding: "8px 14px", fontSize: "0.7rem" }} onClick={post} disabled={busy}>
            Post
          </button>
        </div>
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", marginTop: 8 }}>
          <Link href="/login" style={{ color: "var(--accent)" }}>Sign in</Link> to comment.
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, me, index }: { item: Item; me: Me; index: number }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isOwner = me && (item.owner?.id === me.id || item.ownerId === me.id);

  const sendClaim = async () => {
    if (!message.trim()) return;
    setError("");
    const res = await fetch(`/api/lost-items/${item.id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send");
      return;
    }
    setSent(true);
  };

  return (
    <div className="lf-card" style={{ animationDelay: `${Math.min(index * 0.06, 0.5)}s` }}>
      <div
        className="lf-card__img"
        style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
      >
        {!item.imageUrl && catEmoji(item.category)}
        {(item.imageUrls?.length ?? 0) > 1 && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(30,19,22,0.8)",
              color: "var(--text-hi)",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}
          >
            📷 {item.imageUrls!.length}
          </span>
        )}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-hi)" }}>
            {item.title}
          </div>
          <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
        </div>
        <div style={{ color: "var(--text-mid)", fontSize: "0.85rem" }}>
          {catEmoji(item.category)} {catLabel(item.category)} · 📍 {item.location}
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
          Lost {new Date(item.dateLost).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
          {item.owner && (
            <>
              {" · by "}
              <Link href={`/profile/${item.owner.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                {item.owner.name}
              </Link>
              {item.owner.verified && (
                <span title="Verified member" style={{ color: "var(--vine)", marginLeft: 3 }}>✓</span>
              )}
            </>
          )}
        </div>
        {item.description && (
          <div style={{ color: "var(--text-mid)", fontSize: "0.9rem", lineHeight: 1.55 }}>{item.description}</div>
        )}

        <div style={{ marginTop: "auto", display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }}>
          {!isOwner && item.status === "lost" && (
            me ? (
              <button className="cyber-btn cyber-btn--success" style={{ padding: "8px 14px", fontSize: "0.7rem" }} onClick={() => setContactOpen(!contactOpen)}>
                🙌 I found this
              </button>
            ) : (
              <Link href="/login" style={{ textDecoration: "none" }}>
                <span className="cyber-btn cyber-btn--ghost" style={{ padding: "8px 14px", fontSize: "0.7rem", display: "inline-block" }}>
                  Sign in to help
                </span>
              </Link>
            )
          )}
          {isOwner && (
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <span className="cyber-btn cyber-btn--ghost" style={{ padding: "8px 14px", fontSize: "0.7rem", display: "inline-block" }}>
                Manage in dashboard
              </span>
            </Link>
          )}
          <button className="tab" style={{ padding: "8px 14px", fontSize: "0.7rem" }} onClick={() => setCommentsOpen(!commentsOpen)}>
            💬 Comments
          </button>
        </div>

        {contactOpen && !sent && (
          <div style={{ marginTop: 8 }}>
            <textarea
              className="cyber-textarea"
              rows={2}
              placeholder="Describe where/when you found it — your message goes privately to the owner."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <div style={{ color: "#c94f4f", fontSize: "0.8rem", marginTop: 6 }}>⚠ {error}</div>}
            <button className="cyber-btn" style={{ padding: "8px 16px", fontSize: "0.7rem", marginTop: 8 }} onClick={sendClaim}>
              Send private message
            </button>
          </div>
        )}
        {sent && (
          <div style={{ color: "var(--vine)", fontWeight: 600, fontSize: "0.85rem", marginTop: 8 }}>
            ✓ Sent! The owner will reply in your dashboard messages.
          </div>
        )}

        {commentsOpen && <Comments itemId={item.id} me={me} />}
      </div>
    </div>
  );
}

export default function LostFoundPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  // form state
  const [form, setForm] = useState({ title: "", category: "electronics", location: "", dateLost: "", description: "", website: "" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/lost-items").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([itemsData, meData]) => {
        if (Array.isArray(itemsData)) setItems(itemsData);
        setMe(meData.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (statusFilter === "all" || i.status === statusFilter) &&
        (catFilter === "all" || i.category === catFilter) &&
        (!q ||
          i.title.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q))
    );
  }, [items, statusFilter, catFilter, query]);

  // Step 1: validate then show the preview (nothing saved yet).
  const goToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("idle");
    setShowPreview(true);
  };

  // Step 2: submit for review.
  const submitForReview = async () => {
    setSubmitState("busy");
    setSubmitError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach((p) => fd.append("photos", p));
      const res = await fetch("/api/lost-items", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitState("done");
      setForm({ title: "", category: "electronics", location: "", dateLost: "", description: "", website: "" });
      setPhotos([]);
      setPreviews([]);
      setShowPreview(false);
    } catch (err: any) {
      setSubmitError(err.message);
      setSubmitState("error");
    }
  };

  return (
    <main style={{ height: "100%", overflow: "auto", padding: "36px 24px 60px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 className="cyber-title" style={{ margin: 0, fontSize: "2rem" }}>Lost &amp; Found</h1>
            <div className="cyber-sub" style={{ marginTop: 8 }}>
              Kelowna helps Kelowna · every return earns reputation
            </div>
          </div>
          {me ? (
            <button className="cyber-btn" onClick={() => setFormOpen(!formOpen)}>
              {formOpen ? "Close form" : "＋ Post a lost item"}
            </button>
          ) : (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <span className="cyber-btn" style={{ display: "inline-block" }}>Sign in to post</span>
            </Link>
          )}
        </div>

        {formOpen && me && (
          <div className="glass-panel" style={{ padding: 26, marginBottom: 28 }}>
            <div className="cyber-sub" style={{ marginBottom: 18 }}>
              New listing · reviewed by moderators before going live
            </div>
            {submitState === "done" && (
              <div style={{ color: "var(--success)", fontWeight: 600, marginBottom: 16 }}>
                ✓ Submitted! Your listing will appear once approved.
              </div>
            )}
            {submitState === "error" && (
              <div style={{ color: "var(--danger)", fontWeight: 600, marginBottom: 16 }}>⚠ {submitError}</div>
            )}
            <form onSubmit={goToPreview} style={{ display: showPreview ? "none" : "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>What did you lose?</label>
                <input className="cyber-input" required maxLength={80} placeholder="Black iPhone 15 with grape sticker" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Category</label>
                <select className="cyber-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Where?</label>
                <input className="cyber-input" required maxLength={120} placeholder="Waterfront Park, near the sails" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>When?</label>
                <input type="datetime-local" className="cyber-input" required style={{ colorScheme: "dark" }} value={form.dateLost} onChange={(e) => setForm({ ...form, dateLost: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="cyber-label" style={{ display: "block", marginBottom: 6 }}>Details</label>
                <textarea className="cyber-textarea" rows={3} maxLength={1000} placeholder="Identifying details, reward, etc." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <label className="cyber-btn cyber-btn--ghost" style={{ padding: "9px 16px", fontSize: "0.72rem", cursor: "pointer" }}>
                  📷 {photos.length ? `Photos (${photos.length}/3)` : "Add photos"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []).slice(0, 3);
                      setPhotos(picked);
                      setPreviews(picked.map((f) => URL.createObjectURL(f)));
                    }}
                  />
                </label>
                {previews.map((src, i) => (
                  <img key={i} src={src} alt={`preview ${i + 1}`} style={{ height: 64, borderRadius: 8, border: "1px solid var(--glass-border)" }} />
                ))}
                <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>
                  Up to 3 · JPEG/PNG/WebP · max 3MB each
                </span>
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
                  <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
                </div>
                <button type="submit" className="cyber-btn" style={{ marginLeft: "auto" }}>
                  Preview listing
                </button>
              </div>
            </form>

            {showPreview && (
              <div>
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f1efe8", border: "1px solid var(--glass-border)", color: "var(--text-mid)", fontSize: "0.85rem", marginBottom: 18 }}>
                  Review your listing before submitting. Nothing is saved until you choose <strong>Submit for Review</strong>.
                </div>
                <div className="hud-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-hi)" }}>{form.title || "—"}</strong>
                    <span className="status-pill status-pill--pending">Pending admin approval</span>
                  </div>
                  {previews.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {previews.map((src, i) => (
                        <img key={i} src={src} alt={`preview ${i + 1}`} style={{ height: 80, width: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--glass-border)" }} />
                      ))}
                    </div>
                  )}
                  <dl style={{ margin: "14px 0 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "0.92rem" }}>
                    <dt style={{ color: "var(--text-mid)" }}>Category</dt><dd style={{ margin: 0 }}>{CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category}</dd>
                    <dt style={{ color: "var(--text-mid)" }}>Location</dt><dd style={{ margin: 0 }}>{form.location || "—"} <span style={{ color: "var(--text-dim)" }}>(approximate)</span></dd>
                    <dt style={{ color: "var(--text-mid)" }}>Date</dt><dd style={{ margin: 0 }}>{form.dateLost ? new Date(form.dateLost).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—"}</dd>
                    <dt style={{ color: "var(--text-mid)" }}>Details</dt><dd style={{ margin: 0 }}>{form.description || "—"}</dd>
                  </dl>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowPreview(false)} className="cyber-btn cyber-btn--ghost">Edit</button>
                  <button onClick={submitForReview} disabled={submitState === "busy"} className="cyber-btn">
                    {submitState === "busy" ? "Submitting…" : "Submit for Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
          <div className="tab-row">
            {["all", "lost", "found", "returned"].map((s) => (
              <button key={s} className={`tab ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                {s}
              </button>
            ))}
          </div>
          <input
            className="cyber-input"
            style={{ width: 240 }}
            type="search"
            placeholder="🔍 Search items, places…"
            aria-label="Search lost and found listings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="cyber-select" style={{ width: 220 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-mid)" }}>Loading listings…</div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: 48, textAlign: "center", color: "var(--text-mid)" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>🍷</div>
            Nothing here yet — hopefully everyone&apos;s keeping track of their things.
          </div>
        ) : (
          <div className="lf-grid">
            {filtered.map((item, i) => (
              <ItemCard key={item.id} item={item} me={me} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
