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
          "app:///executors/_next/200.js",
        ),
        originalException: inlineScriptError,
      }),
    ).toBe(true);
  });

  it("drops frames whose origin the SDK left in place", () => {
    expect(
      isForeignError({
        event: eventWithFrames("https://example.com/injected.js"),
        originalException: inlineScriptError,
      }),
    ).toBe(true);
  });

  it("keeps an error with a frame in our bundles", () => {
    expect(
      isForeignError({
        event: eventWithFrames(
          "app:///invite/abc123",
          "app:///_next/static/chunks/0a1b2c3d.js",
        ),
        originalException: inlineScriptError,
      }),
    ).toBe(false);
    expect(
      isForeignError({
        event: eventWithFrames(
          "https://static.rallly.co/_next/static/chunks/0a.js",
        ),
        originalException: inlineScriptError,
      }),
    ).toBe(false);
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
    for (const thrown of ["a string", { stack: "" }, { code: 1 }, undefined]) {
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
