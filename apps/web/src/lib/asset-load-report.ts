// Reports visitors whose browser cannot load scripts or styles from the asset
// host. Sentry and PostHog ship in those same files, so a network that blocks
// the host leaves no trace anywhere else. An inline <head> script watches for
// failed loads and posts one report per tab to the app's own origin.

import * as z from "zod";

export const ASSET_LOAD_REPORT_PATH = "/api/asset-load";

const STALL_MS = 15_000;
const SETTLE_MS = 1000;
const MAX_ELAPSED_MS = 3_600_000;

export const assetLoadReportSchema = z.object({
  // failed: the browser gave up on at least one file. stalled: nothing from
  // the host had run after STALL_MS and nothing had failed either, which is
  // what a firewall that drops packets looks like.
  outcome: z.enum(["failed", "stalled"]),
  failed: z.number().int().min(0).max(1000),
  loaded: z.number().int().min(0).max(1000),
  // False means no chunk from the host executed at all.
  scriptsRan: z.boolean(),
  // Time since navigation start: of the first failure, or of the stall check.
  // Fast failures point to DNS or a reset, slow ones to a timeout. The script
  // clamps it, so a chunk that fails late in a long-lived tab still reports.
  ms: z.number().int().min(0).max(MAX_ELAPSED_MS),
});

export type AssetLoadReport = z.infer<typeof assetLoadReportSchema>;

// Serialized into an inline <head> script, so it must stay self contained: no
// imports and no references to anything else in this module.
export function installAssetLoadReport(
  assetPrefix: string,
  endpoint: string,
  stallMs: number,
  settleMs: number,
  maxElapsedMs: number,
) {
  try {
    const SENT_KEY = "rallly:asset-load-reported";
    const base = `${assetPrefix}/_next/static/`;
    let failed = 0;
    let loaded = 0;
    let firstFailureAt = 0;
    let sent = false;

    const isAsset = (target: EventTarget | null) => {
      const el = target as {
        tagName?: string;
        src?: unknown;
        href?: unknown;
      } | null;
      const url =
        el?.tagName === "SCRIPT"
          ? el.src
          : el?.tagName === "LINK"
            ? el.href
            : null;
      return typeof url === "string" && url.indexOf(base) === 0;
    };

    const scriptsRan = () =>
      (globalThis as { TURBOPACK?: unknown }).TURBOPACK !== undefined;

    const send = (outcome: "failed" | "stalled") => {
      // Offline visitors fail every load without being blocked.
      if (sent || navigator.onLine === false) return;
      sent = true;
      try {
        if (window.sessionStorage.getItem(SENT_KEY)) return;
        window.sessionStorage.setItem(SENT_KEY, "1");
      } catch {
        // No storage: report anyway, once per page.
      }
      const body = JSON.stringify({
        outcome,
        failed,
        loaded,
        scriptsRan: scriptsRan(),
        ms: Math.min(
          maxElapsedMs,
          Math.round(outcome === "failed" ? firstFailureAt : performance.now()),
        ),
      });
      if (!navigator.sendBeacon?.(endpoint, body)) {
        void fetch(endpoint, {
          method: "POST",
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Resource load and error events do not bubble, so listen in capture.
    document.addEventListener(
      "load",
      (event) => {
        if (isAsset(event.target)) loaded++;
      },
      true,
    );
    document.addEventListener(
      "error",
      (event) => {
        if (!isAsset(event.target)) return;
        failed++;
        if (failed > 1) return;
        firstFailureAt = performance.now();
        // A blocked host fails every file; wait for the rest to be counted.
        setTimeout(() => send("failed"), settleMs);
      },
      true,
    );

    setTimeout(() => {
      if (failed > 0 || scriptsRan()) return;
      if (!document.querySelector(`script[src^="${base}"]`)) return;
      send("stalled");
    }, stallMs);
  } catch {
    // Diagnostics only; never break page boot.
  }
}

export function assetLoadReportScript(assetPrefix: string) {
  const args = [
    assetPrefix,
    ASSET_LOAD_REPORT_PATH,
    STALL_MS,
    SETTLE_MS,
    MAX_ELAPSED_MS,
  ]
    .map((arg) => JSON.stringify(arg).replace(/</g, "\\u003c"))
    .join(",");
  return `(${installAssetLoadReport.toString()})(${args})`;
}
