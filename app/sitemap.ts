import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "https://safekelowna.com";
  const pages = [
    "", "/map", "/alerts", "/lost-found", "/report", "/leaderboard",
    "/roadmap", "/about", "/guidelines", "/privacy", "/terms", "/contact",
  ];
  return pages.map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: path === "" || path === "/map" || path === "/alerts" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/map" ? 0.9 : 0.6,
  }));
}
