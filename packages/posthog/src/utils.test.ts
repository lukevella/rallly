import type { CaptureResult } from "posthog-js";
import { describe, expect, it } from "vitest";
import {
  isAbortError,
  isResizeObserverLoopError,
  isUnsymbolicatedMinifiedException,
} from "./utils";

describe("isAbortError", () => {
  const event = (exceptionList: unknown) =>
    ({
      properties: { $exception_list: exceptionList },
    }) as unknown as CaptureResult;

  it("matches an aborted tRPC request", () => {
    expect(
      isAbortError(
        event([
          { type: "TRPCClientError", value: "The operation was aborted. " },
          {
            type: "DOMException",
            value: "AbortError: The operation was aborted. ",
          },
        ]),
      ),
    ).toBe(true);
  });

  it("matches a bare AbortError DOMException", () => {
    expect(
      isAbortError(
        event([
          {
            type: "DOMException",
            value: "AbortError: The user aborted a request.",
          },
        ]),
      ),
    ).toBe(true);
  });

  it("does not match an unrelated exception", () => {
    expect(
      isAbortError(
        event([{ type: "TypeError", value: "x is not a function" }]),
      ),
    ).toBe(false);
  });

  it("does not match when the exception list is missing", () => {
    expect(isAbortError({ properties: {} } as unknown as CaptureResult)).toBe(
      false,
    );
  });
});

describe("isResizeObserverLoopError", () => {
  const event = (exceptionList: unknown) =>
    ({
      properties: { $exception_list: exceptionList },
    }) as unknown as CaptureResult;

  it("matches the undelivered notifications notice", () => {
    expect(
      isResizeObserverLoopError(
        event([
          {
            type: "Error",
            value:
              "ResizeObserver loop completed with undelivered notifications.",
          },
        ]),
      ),
    ).toBe(true);
  });

  it("matches the loop limit exceeded notice", () => {
    expect(
      isResizeObserverLoopError(
        event([{ type: "Error", value: "ResizeObserver loop limit exceeded" }]),
      ),
    ).toBe(true);
  });

  it("does not match an unrelated exception", () => {
    expect(
      isResizeObserverLoopError(
        event([{ type: "TypeError", value: "x is not a function" }]),
      ),
    ).toBe(false);
  });

  it("does not match when the exception list is missing", () => {
    expect(
      isResizeObserverLoopError({
        properties: {},
      } as unknown as CaptureResult),
    ).toBe(false);
  });
});

describe("isUnsymbolicatedMinifiedException", () => {
  const event = (exceptionList: unknown) =>
    ({
      properties: { $exception_list: exceptionList },
    }) as unknown as CaptureResult;

  const documentFrames = [
    { filename: "https://app.rallly.co/", function: "?" },
    { filename: "https://app.rallly.co/", function: "?" },
  ];

  it("matches a minified identifier with no /_next/static frame", () => {
    for (const value of ["fa", "ga", "Ba", "Ca"]) {
      expect(
        isUnsymbolicatedMinifiedException(
          event([
            { type: "Error", value, stacktrace: { frames: documentFrames } },
          ]),
        ),
      ).toBe(true);
    }
  });

  it("does not match when a frame resolves to a /_next/static chunk", () => {
    expect(
      isUnsymbolicatedMinifiedException(
        event([
          {
            type: "Error",
            value: "Ca",
            stacktrace: {
              frames: [
                ...documentFrames,
                { filename: "https://app.rallly.co/_next/static/chunk.js" },
              ],
            },
          },
        ]),
      ),
    ).toBe(false);
  });

  it("does not match a readable error message", () => {
    expect(
      isUnsymbolicatedMinifiedException(
        event([
          {
            type: "TypeError",
            value: "x is not a function",
            stacktrace: { frames: documentFrames },
          },
        ]),
      ),
    ).toBe(false);
  });

  it("does not match a minified value without a stack", () => {
    expect(
      isUnsymbolicatedMinifiedException(
        event([{ type: "Error", value: "Ca", stacktrace: { frames: [] } }]),
      ),
    ).toBe(false);
    expect(
      isUnsymbolicatedMinifiedException(
        event([{ type: "Error", value: "Ca" }]),
      ),
    ).toBe(false);
  });

  it("does not match when the exception list is missing", () => {
    expect(
      isUnsymbolicatedMinifiedException({
        properties: {},
      } as unknown as CaptureResult),
    ).toBe(false);
  });
});
