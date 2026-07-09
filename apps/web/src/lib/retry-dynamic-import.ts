const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;
const TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Dynamic import timed out"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a dynamic `import()` factory so a transient chunk-load failure (flaky
 * network, in-app browsers, a chunk that briefly hangs) is retried a few times
 * with a timeout and exponential backoff before it is allowed to reject.
 *
 * Without this, `next/dynamic(..., { ssr: false })` leaves the page suspended
 * on its loading fallback forever when the chunk never resolves. Retrying gives
 * the load another chance; if it still fails the rejection propagates to the
 * nearest error boundary so a recovery path can be shown.
 */
export function retryDynamicImport<T>(factory: () => Promise<T>) {
  return async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        return await withTimeout(factory(), TIMEOUT_MS);
      } catch (error) {
        lastError = error;
        if (attempt < MAX_ATTEMPTS - 1) {
          await delay(BASE_DELAY_MS * 2 ** attempt);
        }
      }
    }
    throw lastError;
  };
}
