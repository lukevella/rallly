import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isModuleFactoryError,
  reloadOnceForChunkError,
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

describe("reloadOnceForChunkError", () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("location", { ...window.location, reload });
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    reload.mockReset();
  });

  it("reloads once and not again within the cooldown", () => {
    reloadOnceForChunkError(factoryError);
    reloadOnceForChunkError(factoryError);
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again after the cooldown", () => {
    reloadOnceForChunkError(factoryError);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    reloadOnceForChunkError(factoryError);
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("does not reload for other errors", () => {
    reloadOnceForChunkError(new Error("boom"));
    vi.runAllTimers();
    expect(reload).not.toHaveBeenCalled();
  });
});
