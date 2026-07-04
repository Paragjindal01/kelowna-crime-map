export default function StaticPage({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main style={{ height: "100%", overflow: "auto", padding: "48px 24px 70px" }}>
      <div className="glass-panel" style={{ maxWidth: 760, margin: "0 auto", padding: "40px 36px" }}>
        <h1 className="cyber-title" style={{ margin: 0, fontSize: "1.9rem" }}>{title}</h1>
        <div className="cyber-sub" style={{ marginTop: 10 }}>{subtitle}</div>
        {updated && (
          <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", marginTop: 8 }}>
            Last updated: {updated}
          </div>
        )}
        <div className="static-prose" style={{ marginTop: 28 }}>{children}</div>
      </div>
    </main>
  );
}
