/**
 * Thin Upstash Redis REST client — no npm dependency required.
 *
 * Supports the two credential shapes Vercel KV / Upstash uses:
 *   KV_REST_API_URL  + KV_REST_API_TOKEN   (Vercel KV)
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN  (direct Upstash)
 *
 * Returns `null` for every operation when env vars are absent, so callers
 * can treat a missing Redis as a warm-cache miss (graceful degradation).
 */

function getConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand(
  args: (string | number)[],
): Promise<unknown | null> {
  const config = getConfig();
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([args]),
      // Avoid hanging serverless functions
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: unknown; error?: string }>;
    if (data[0]?.error) return null;
    return data[0]?.result ?? null;
  } catch {
    return null;
  }
}

export const redis = {
  /** GET key → parsed value, or null on miss / error */
  async get<T>(key: string): Promise<T | null> {
    const result = await redisCommand(["GET", key]);
    if (result === null || result === undefined) return null;
    try {
      return JSON.parse(result as string) as T;
    } catch {
      return null;
    }
  },

  /** SET key value EX ttlSeconds — fire-and-forget style; errors are swallowed */
  async set(key: string, value: unknown, ttlSeconds = 86400): Promise<void> {
    await redisCommand(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
  },

  /** DEL key — silently removes a key; errors are swallowed */
  async del(key: string): Promise<void> {
    await redisCommand(["DEL", key]);
  },

  /** Returns true if Redis is reachable (env vars configured) */
  isConfigured(): boolean {
    return getConfig() !== null;
  },
};
