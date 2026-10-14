// Turbopack throws this when a chunk has registered but lacks a module the
// page expects. WebKit browsers hit it since static assets moved to a separate
// host, and a fresh load usually works, so recover by reloading once and send
// Sentry what the browser actually received for each chunk.

const RELOAD_KEY = "rallly:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

export function isModuleFactoryError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return message.includes("module factory is not available");
}

type StaticAssetEntry = Pick<
  PerformanceResourceTiming,
  | "name"
  | "initiatorType"
  | "nextHopProtocol"
  | "transferSize"
  | "encodedBodySize"
  | "decodedBodySize"
  | "duration"
> & { responseStatus?: number; deliveryType?: string };

export function summarizeStaticAssets(entries: StaticAssetEntry[]) {
  return entries
    .filter((entry) => entry.name.includes("/_next/static/"))
    .map((entry) => ({
      file: entry.name.slice(entry.name.lastIndexOf("/") + 1),
      initiator: entry.initiatorType,
      protocol: entry.nextHopProtocol,
      status: entry.responseStatus,
      delivery: entry.deliveryType,
      // transferSize 0 with a body means it came from the browser cache;
      // encoded and decoded sizes that disagree with other loads of the same
      // file point to a truncated or altered response.
      transfer: entry.transferSize,
      encoded: entry.encodedBodySize,
      decoded: entry.decodedBodySize,
      ms: Math.round(entry.duration),
    }));
}

function readReloadedAt() {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_KEY)) || null;
  } catch {
    return null;
  }
}

export function getChunkRecoveryContext() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const reloadedAt = readReloadedAt();
  return {
    navigationType: navigation?.type,
    reloadedRecently:
      reloadedAt !== null && Date.now() - reloadedAt < RELOAD_COOLDOWN_MS,
    assets: summarizeStaticAssets(
      performance.getEntriesByType("resource") as PerformanceResourceTiming[],
    ),
  };
}

export function reloadOnceForChunkError(error: unknown) {
  if (!isModuleFactoryError(error)) return;
  const reloadedAt = readReloadedAt();
  if (reloadedAt !== null && Date.now() - reloadedAt < RELOAD_COOLDOWN_MS) {
    return;
  }
  try {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage there is no loop guard, so never reload.
    return;
  }
  // Let Sentry hand its event to the transport first; it uses keepalive, so
  // the request survives the navigation.
  setTimeout(() => window.location.reload(), 0);
}
