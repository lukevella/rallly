import { describe, expect, it } from "vitest";
import { isForeignError } from "./foreign-error";

function eventWithFrames(...filenames: (string | undefined)[]) {
  return {
    exception: {
      values: [
        {
          stacktrace: {
            frames: filenames.map((filename) => ({ filename })),
          },
        },
      ],
    },
  };
}

describe("isForeignError", () => {
  it("drops an inline script in the page, as the SDK normalizes it", () => {
    expect(isForeignError(eventWithFrames("app:///invite/abc123"))).toBe(true);
  });

  it("drops a script served from a path we don't own", () => {
    expect(
      isForeignError(
        eventWithFrames("app:///executors/200.js", "app:///executors/200.js"),
      ),
    ).toBe(true);
  });

  it("drops frames whose origin the SDK left in place", () => {
    expect(
      isForeignError(eventWithFrames("https://example.com/injected.js")),
    ).toBe(true);
  });

  it("keeps an error with a frame in our bundles", () => {
    expect(
      isForeignError(
        eventWithFrames(
          "app:///invite/abc123",
          "app:///_next/static/chunks/0a1b2c3d.js",
        ),
      ),
    ).toBe(false);
    expect(
      isForeignError(
        eventWithFrames("https://static.rallly.co/_next/static/chunks/0a.js"),
      ),
    ).toBe(false);
  });

  it("keeps an error with a frame of unknown origin", () => {
    expect(
      isForeignError(eventWithFrames("app:///invite/abc123", "<anonymous>")),
    ).toBe(false);
    expect(
      isForeignError(eventWithFrames("app:///invite/abc123", undefined)),
    ).toBe(false);
    expect(isForeignError(eventWithFrames("[native code]"))).toBe(false);
  });

  it("keeps an error without frames", () => {
    expect(isForeignError(eventWithFrames())).toBe(false);
    expect(isForeignError({})).toBe(false);
  });
});
