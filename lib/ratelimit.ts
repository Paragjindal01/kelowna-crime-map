// Simple in-memory sliding-window rate limiter. Good enough for a single
// Node process; swap for Redis/Upstash if the app is ever deployed on
// serverless or multiple instances.

const buckets = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/** Returns true if the action is allowed, false if rate-limited. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export const rateLimited = { error: "Too many requests — please slow down and try again shortly" };
