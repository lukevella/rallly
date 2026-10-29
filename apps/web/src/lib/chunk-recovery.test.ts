import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isModuleFactoryError,
  reloadOnceForChunkError,
  staticAssetUrls,
  summarizeStaticAssets,
} from "./chunk-recovery";

const factoryError = new Error(
  "Module 304577 was instantiated because it was required from module 878939, but the module factory is not available.",
);

describe("isModuleFactoryError", () => {
  it("matches the Turbopack missing factory error", () => {
    expect(isModuleFactoryError(factoryError)).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isModuleFactoryError(new Error("Load failed"))).toBe(false);
    expect(isModuleFactoryError(undefined)).toBe(false);
  });
});

describe("summarizeStaticAssets", () => {
  it("keeps only Next static assets and names them by file", () => {
    const entry = {
      initiatorType: "script",
      nextHopProtocol: "h3",
      transferSize: 0,
      encodedBodySize: 1200,
      decodedBodySize: 4800,
      duration: 12.4,
      responseStatus: 200,
      deliveryType: "cache",
    };
    expect(
      summarizeStaticAssets([
        {
          ...entry,
          name: "https://static.rallly.co/_next/static/immutable/chunks/2j4m7ciojig3r.js",
        },
        { ...entry, name: "https://b.rallly.co/decide" },
      ]),
    ).toEqual([
      {
        file: "2j4m7ciojig3r.js",
        initiator: "script",
        protocol: "h3",
        status: 200,
        delivery: "cache",
        transfer: 0,
        encoded: 1200,
        decoded: 4800,
        ms: 12,
      },
    ]);
  });
});

describe("staticAssetUrls", () => {
  it("keeps each Next static asset once", () => {
    const chunk =
      "https://static.rallly.co/_next/static/immutable/chunks/2dixsi-13gzup.js";
    expect(
      staticAssetUrls([
        { name: chunk },
        { name: chunk },
        { name: "https://b.rallly.co/decide" },
      ]),
    ).toEqual([chunk]);
  });
});

describe("reloadOnceForChunkError", () => {
  const reload = vi.fn();
  const fetch = vi.fn();
  const chunk =
    "https://static.rallly.co/_next/static/immutable/chunks/2dixsi-13gzup.js";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("location", { ...window.location, reload });
    vi.stubGlobal("fetch", fetch.mockResolvedValue(new Response()));
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([
      { name: chunk } as PerformanceEntry,
    ]);
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    reload.mockReset();
    fetch.mockReset();
  });

  it("refetches static assets past the cache before reloading", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASSET_PREFIX", "");
    reloadOnceForChunkError(factoryError);
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalledWith(
      chunk,
      expect.objectContaining({
        cache: "reload",
        mode: "no-cors",
        credentials: "include",
      }),
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("refetches in CORS mode when chunks come from an asset host", async () => {
    vi.stubEnv("NEXT_PUBLIC_ASSET_PREFIX", "https://static.rallly.co");
    reloadOnceForChunkError(factoryError);
    await vi.runAllTimersAsync();
    expect(fetch).toHaveBeenCalledWith(
      chunk,
      expect.objectContaining({
        cache: "reload",
        mode: "cors",
        credentials: "same-origin",
      }),
    );
  });

  it("still reloads when a refetch fails", async () => {
    fetch.mockRejectedValue(new TypeError("Load failed"));
    reloadOnceForChunkError(factoryError);
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads once and not again within the cooldown", async () => {
    reloadOnceForChunkError(factoryError);
    reloadOnceForChunkError(factoryError);
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again after the cooldown", async () => {
    reloadOnceForChunkError(factoryError);
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1);
    reloadOnceForChunkError(factoryError);
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not reload for other errors", async () => {
    reloadOnceForChunkError(new Error("boom"));
    await vi.runAllTimersAsync();
    expect(reload).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
