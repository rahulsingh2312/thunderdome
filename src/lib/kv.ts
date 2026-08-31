/**
 * Tiny JSON document store. Primary backend: our own arena-store API on the
 * ops box (Vercel Blob ran out of free operations). Blob remains as a
 * fallback backend, then process memory for dev. Last write wins.
 */

const memory = new Map<string, unknown>();

// Short read-through cache: the board endpoints poll hard, the data drifts
// slowly, and every skipped round trip is one less op on whatever backend.
const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 10_000;

const storeUrl = () => process.env.ARENA_STORE_URL?.replace(/\/$/, "");
const storeConfigured = () => Boolean(storeUrl() && process.env.ARENA_STORE_SECRET);
const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;

  if (storeConfigured()) {
    try {
      const res = await fetch(`${storeUrl()}/kv/${encodeURIComponent(key)}`, {
        headers: { authorization: `Bearer ${process.env.ARENA_STORE_SECRET}` },
        cache: "no-store",
      });
      if (res.status === 404) return (memory.get(key) as T) ?? fallback;
      if (res.ok) {
        const value = (await res.json()) as T;
        cache.set(key, { at: Date.now(), value });
        return value;
      }
    } catch {}
    return (memory.get(key) as T) ?? fallback;
  }

  if (!blobConfigured()) return (memory.get(key) as T) ?? fallback;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: key, limit: 1 });
    if (!blobs.length) return (memory.get(key) as T) ?? fallback;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return (memory.get(key) as T) ?? fallback;
    const value = (await res.json()) as T;
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return (memory.get(key) as T) ?? fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  memory.set(key, value);
  cache.set(key, { at: Date.now(), value });

  if (storeConfigured()) {
    try {
      await fetch(`${storeUrl()}/kv/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${process.env.ARENA_STORE_SECRET}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(value),
      });
    } catch {
      // Memory copy stands; the next write retries.
    }
    return;
  }

  if (!blobConfigured()) return;
  try {
    const { put } = await import("@vercel/blob");
    await put(key, JSON.stringify(value), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } catch {
    // Memory copy stands; the next write retries.
  }
}
