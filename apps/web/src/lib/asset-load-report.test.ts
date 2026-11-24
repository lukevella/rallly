import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ASSET_LOAD_REPORT_PATH,
  assetLoadReportSchema,
  assetLoadReportScript,
} from "./asset-load-report";

const ASSET_HOST = "https://static.rallly.co";
const g = globalThis as Record<string, unknown>;

// Runs the exact string the layout inlines.
const install = () => new Function(assetLoadReportScript(ASSET_HOST))();

function addScript(src: string) {
  const script = document.createElement("script");
  // jsdom does not fetch scripts, so the events are dispatched by hand.
  script.setAttribute("src", src);
  document.head.appendChild(script);
  return script;
}

const chunk = (name: string) =>
  addScript(`${ASSET_HOST}/_next/static/immutable/chunks/${name}`);

describe("asset load report", () => {
  let sendBeacon: ReturnType<typeof vi.fn>;

  const reports = () =>
    sendBeacon.mock.calls.map(([url, body]) => ({
      url,
      report: assetLoadReportSchema.parse(JSON.parse(body as string)),
    }));

  beforeEach(() => {
    vi.useFakeTimers();
    sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { onLine: true, sendBeacon });
    window.sessionStorage.clear();
    document.head.innerHTML = "";
    delete g.TURBOPACK;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reports once when files from the asset host fail", () => {
    install();
    chunk("a.js").dispatchEvent(new Event("error"));
    chunk("b.js").dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(20_000);

    expect(reports()).toEqual([
      {
        url: ASSET_LOAD_REPORT_PATH,
        report: expect.objectContaining({
          outcome: "failed",
          failed: 2,
          loaded: 0,
          scriptsRan: false,
        }),
      },
    ]);
  });

  it("counts the files that did load", () => {
    install();
    chunk("a.js").dispatchEvent(new Event("load"));
    g.TURBOPACK = [];
    chunk("b.js").dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(20_000);

    expect(reports()[0]?.report).toMatchObject({
      outcome: "failed",
      failed: 1,
      loaded: 1,
      scriptsRan: true,
    });
  });

  it("ignores failures from other hosts", () => {
    install();
    addScript("https://example.com/widget.js").dispatchEvent(
      new Event("error"),
    );
    g.TURBOPACK = [];
    vi.advanceTimersByTime(20_000);

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("reports a stall when nothing from the host has run or failed", () => {
    install();
    chunk("a.js");
    vi.advanceTimersByTime(20_000);

    expect(reports()[0]?.report).toMatchObject({
      outcome: "stalled",
      failed: 0,
      scriptsRan: false,
    });
  });

  it("stays quiet when the chunks ran", () => {
    install();
    chunk("a.js").dispatchEvent(new Event("load"));
    g.TURBOPACK = [];
    vi.advanceTimersByTime(20_000);

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("stays quiet when the visitor is offline", () => {
    vi.stubGlobal("navigator", { onLine: false, sendBeacon });
    install();
    chunk("a.js").dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(20_000);

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("clamps the elapsed time of a failure late in a long-lived tab", () => {
    install();
    vi.spyOn(performance, "now").mockReturnValue(5 * 3_600_000);
    chunk("a.js").dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(2000);

    expect(reports()[0]?.report).toMatchObject({
      outcome: "failed",
      ms: 3_600_000,
    });
  });

  it("reports once per tab across page loads", () => {
    install();
    chunk("a.js").dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(20_000);
    // A second page load in the same tab installs the script again.
    install();
    chunk("b.js").dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(20_000);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});
