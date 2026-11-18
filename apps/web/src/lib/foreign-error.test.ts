import { describe, expect, it } from "vitest";
import { isForeignError } from "./foreign-error";

function eventWithFrames(...filenames: (string | undefined)[]) {
  return {
    exception: {
      values: [
        {
          stacktrace: {
            frames: filenames.map((filename) => ({
              filename,
              lineno: 1,
              colno: 16,
            })),
          },
        },
      ],
    },
  };
}

const inlineScriptError = {
  stack: "global code@https://app.rallly.co/invite/abc123:1:16",
};

describe("isForeignError", () => {
  it("drops an inline script in the page, as the SDK normalizes it", () => {
    expect(
      isForeignError({
        event: eventWithFrames("app:///invite/abc123"),
        originalException: inlineScriptError,
      }),
    ).toBe(true);
  });

  it("drops a script served from a path we don't own", () => {
    expect(
      isForeignError({
        event: eventWithFrames(
          "app:///executors/200.js",
          "app:///executors/200.js?asset=/_next/static/",
        ),
        originalException: undefined,
      }),
    ).toBe(true);
  });

  it("drops a single frame parsed from an Error inside a rejected object", () => {
    expect(
      isForeignError({
        event: eventWithFrames("app:///executors/200.js"),
        originalException: {
          cause: {
            stack:
              "Error: executor failed\n    at C (https://app.rallly.co/executors/200.js:1:16)",
          },
        },
      }),
    ).toBe(true);
  });

  it("drops frames whose origin the SDK left in place", () => {
    expect(
      isForeignError({
        event: eventWithFrames("https://example.com/injected.js"),
        originalException: {
          stack: "Error: x\n    at https://example.com/injected.js:1:16",
        },
      }),
    ).toBe(true);
  });

  it("keeps an error with a frame in our bundles", () => {
    for (const ours of [
      "app:///_next/static/chunks/0a1b2c3d.js",
      "app:///assets/_next/static/chunks/0a1b2c3d.js",
      "https://static.rallly.co/_next/static/chunks/0a.js",
    ]) {
      expect(
        isForeignError({
          event: eventWithFrames("app:///invite/abc123", ours),
          originalException: inlineScriptError,
        }),
      ).toBe(false);
    }
  });

  it("keeps an error with a frame of unknown origin", () => {
    for (const unknown of ["<anonymous>", "[native code]", undefined]) {
      expect(
        isForeignError({
          event: eventWithFrames("app:///invite/abc123", unknown),
          originalException: inlineScriptError,
        }),
      ).toBe(false);
    }
  });

  it("keeps an error whose only frame the SDK made up from the page URL", () => {
    const throwing = Object.defineProperty({}, "stack", {
      get() {
        throw new Error("unreadable");
      },
    });
    for (const thrown of [
      "a string",
      { stack: "" },
      { stack: "Error: timed out at 12:34:56" },
      { stack: "Error: failed at 1:16" },
      { code: 1 },
      throwing,
      undefined,
    ]) {
      expect(
        isForeignError({
          event: eventWithFrames("app:///invite/abc123"),
          originalException: thrown,
        }),
      ).toBe(false);
    }
  });

  it("keeps an error without frames", () => {
    expect(
      isForeignError({
        event: eventWithFrames(),
        originalException: inlineScriptError,
      }),
    ).toBe(false);
    expect(
      isForeignError({ event: {}, originalException: inlineScriptError }),
    ).toBe(false);
  });
});
