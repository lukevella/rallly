import "server-only";
import { redis } from "@/lib/kv";

export type Unit = "ms" | "s" | "m" | "h" | "d";
export type Duration = `${number} ${Unit}` | `${number}${Unit}`;

const unitToMs: Record<Unit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseDurationMs(duration: Duration): number {
  const match = duration.match(/^(\d+)\s?(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return Number(match[1]) * unitToMs[match[2] as Unit];
}

interface Cache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  name: "redis" | "memory";
}

function createMemoryCache<T>(prefix: string, ttlMs: number): Cache<T> {
  const store = new Map<string, { value: T; expiresAt: number }>();

  return {
    async get(key) {
      const entry = store.get(prefix + key);
      if (!entry) return null;
      if (Date.now() >= entry.expiresAt) {
        store.delete(prefix + key);
        return null;
      }
      return entry.value;
    },
    async set(key, value) {
      store.set(prefix + key, { value, expiresAt: Date.now() + ttlMs });
    },
    name: "memory",
  };
}

/**
 * Creates a namespaced cache backed by the configured KV store, falling back
 * to an in-memory Map when no KV is configured (e.g. self-hosted without Redis).
 */
export function createCache<T>({
  namespace,
  ttl,
}: {
  namespace: string;
  ttl: Duration;
}): Cache<T> {
  const ttlMs = parseDurationMs(ttl);
  const prefix = `cache:${namespace}:`;

  if (redis) {
    const client = redis;
    const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));
    return {
      async get(key) {
        return (await client.get<T>(prefix + key)) ?? null;
      },
      async set(key, value) {
        await client.set(prefix + key, value, { ex: ttlSeconds });
      },
      name: "redis",
    };
  }

  return createMemoryCache<T>(prefix, ttlMs);
}
