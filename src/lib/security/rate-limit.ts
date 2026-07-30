import "server-only";

type Bucket = { count: number; resetsAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {},
) {
  const limit = options.limit ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();
  const current = buckets.get(key);
  const bucket =
    !current || current.resetsAt <= now
      ? { count: 0, resetsAt: now + windowMs }
      : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000)),
  };
}

export function requestKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  const ip = forwarded?.trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}
