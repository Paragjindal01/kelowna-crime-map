import type { Metadata } from "next";

// The admin console must never be indexed. Access control is enforced
// server-side via ADMIN_KEY on every /api/admin route — hiding the page is
// a courtesy, not the security boundary.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
