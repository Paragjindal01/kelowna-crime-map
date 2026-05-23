import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 24px",
      backgroundColor: "#1e293b",
      color: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
        <Link href="/" style={{ color: "white", textDecoration: "none" }}>
          Kelowna GeoDASH
        </Link>
      </div>
      <div style={{ display: "flex", gap: "20px" }}>
        <Link href="/" style={{ color: "#cbd5e1", textDecoration: "none", fontWeight: 500 }}>
          Map
        </Link>
        <Link href="/report" style={{ color: "#cbd5e1", textDecoration: "none", fontWeight: 500 }}>
          Submit Report
        </Link>
        <Link href="/admin" style={{ color: "#cbd5e1", textDecoration: "none", fontWeight: 500 }}>
          Admin
        </Link>
      </div>
    </nav>
  );
}
