/**
 * Test double for the subset of the Upstash client the rate limiter uses.
 * Interprets the increment script's semantics in memory: one counter per
 * key with an expiry, INCR on every call, expiry armed on first hit. Tests
 * control the clock through `now` and reset the store between cases.
 */
export type FakeRedis = ReturnType<typeof createFakeRedis>;

export function createFakeRedis(options?: { now?: () => number }) {
  const now = options?.now ?? (() => Date.now());
  let counters = new Map<string, { hits: number; expiresAt: number }>();
  let failWith: Error | null = null;

  const bump = (key: string, windowMs: number) => {
    const current = counters.get(key);
    if (!current || current.expiresAt <= now()) {
      const fresh = { hits: 1, expiresAt: now() + windowMs };
      counters.set(key, fresh);
      return [fresh.hits, windowMs];
    }
    current.hits += 1;
    return [current.hits, current.expiresAt - now()];
  };

  return {
    createScript: () => ({
      exec: async (keys: string[], args: string[]) => {
        if (failWith) {
          throw failWith;
        }
        return [
          ...bump(keys[0], Number(args[0])),
          ...bump(keys[1], Number(args[1])),
        ];
      },
    }),
    reset: () => {
      counters = new Map();
      failWith = null;
    },
    failNextCallsWith: (error: Error | null) => {
      failWith = error;
    },
    hits: (key: string) => counters.get(key)?.hits ?? 0,
  };
}
