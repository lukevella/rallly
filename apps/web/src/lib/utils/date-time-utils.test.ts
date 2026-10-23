import { afterEach, describe, expect, it, vi } from "vitest";
import { detectBrowserTimeZone, getBrowserTimeZone } from "./date-time-utils";

function reportTimeZone(timeZone: string) {
  const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(
    function (this: Intl.DateTimeFormat) {
      return { ...resolvedOptions.call(this), timeZone };
    },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("detectBrowserTimeZone", () => {
  it("returns the zone the device reports", () => {
    reportTimeZone("Europe/Malta");
    expect(detectBrowserTimeZone()).toBe("Europe/Malta");
  });

  it("treats a zone Intl rejects as unknown", () => {
    reportTimeZone("Etc/Unknown");
    expect(detectBrowserTimeZone()).toBeUndefined();
  });
});

describe("getBrowserTimeZone", () => {
  it("falls back to UTC when the device zone is unknown", () => {
    reportTimeZone("Etc/Unknown");
    expect(getBrowserTimeZone()).toBe("UTC");
  });
});
