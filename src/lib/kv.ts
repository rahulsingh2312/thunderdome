/**
 * Tiny JSON document store on Vercel Blob with an in-memory fallback for dev.
 * Last write wins; fine at this scale, revisit if writes ever contend hard.
 */

const memory = new Map<string, unknown>();

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  if (!blobConfigured()) return (memory.get(key) as T) ?? fallback;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: key, limit: 1 });
    if (!blobs.length) return (memory.get(key) as T) ?? fallback;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return (memory.get(key) as T) ?? fallback;
    return (await res.json()) as T;
  } catch {
    return (memory.get(key) as T) ?? fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  memory.set(key, value);
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
