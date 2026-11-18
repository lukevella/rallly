import { describe, expect, it } from "vitest";
import { isForeignError } from "./foreign-error";

type Frame = { filename?: string; function?: string };

function eventWith(...exceptions: Frame[][]) {
  return {
    exception: {
      values: exceptions.map((frames) => ({ stacktrace: { frames } })),
    },
  };
}

const inline = { filename: "app:///invite/abc123", function: "global code" };
const injected = { filename: "app:///executors/200.js", function: "C" };
const ours = { filename: "app:///_next/static/chunks/0a1b2c3d.js" };

describe("isForeignError", () => {
  it("drops an inline script in the page, as the SDK normalizes it", () => {
    expect(isForeignError(eventWith([inline]))).toBe(true);
  });

  it("drops a script served from a path we don't own", () => {
    expect(
      isForeignError(
        eventWith([
          injected,
          { filename: "app:///executors/200.js?asset=/_next/static/" },
        ]),
      ),
    ).toBe(true);
  });

  it("drops frames whose origin the SDK left in place", () => {
    expect(
      isForeignError(
        eventWith([
          { filename: "https://example.com/injected.js", function: "run" },
        ]),
      ),
    ).toBe(true);
  });

  it("drops linked errors that are all foreign", () => {
    expect(isForeignError(eventWith([inline], [injected, injected]))).toBe(
      true,
    );
  });

  it("keeps an error with a frame in our bundles", () => {
    for (const frame of [
      ours,
      { filename: "app:///assets/_next/static/chunks/0a1b2c3d.js" },
      { filename: "https://static.rallly.co/_next/static/chunks/0a.js" },
    ]) {
      expect(isForeignError(eventWith([inline, frame]))).toBe(false);
      expect(isForeignError(eventWith([inline], [injected, frame]))).toBe(
        false,
      );
    }
  });

  it("keeps an error with a frame of unknown origin", () => {
    for (const filename of ["<anonymous>", "[native code]", undefined]) {
      expect(isForeignError(eventWith([inline, { filename }]))).toBe(false);
    }
  });

  it("keeps a lone frame without a function, which the SDK may have made up from the page URL", () => {
    for (const frame of [
      { filename: "app:///invite/abc123", function: "?" },
      { filename: "app:///invite/abc123" },
    ]) {
      expect(isForeignError(eventWith([frame]))).toBe(false);
      expect(isForeignError(eventWith([frame], [injected, injected]))).toBe(
        false,
      );
    }
  });

  it("keeps an error without frames", () => {
    expect(isForeignError(eventWith([]))).toBe(false);
    expect(isForeignError(eventWith([], [injected, injected]))).toBe(false);
    expect(isForeignError({})).toBe(false);
  });
});
