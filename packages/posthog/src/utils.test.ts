import type { CaptureResult } from "posthog-js";
import { describe, expect, it } from "vitest";
import {
  getPostHogCookieName,
  isAbortError,
  parsePostHogCookieDistinctId,
} from "./utils";

describe("getPostHogCookieName", () => {
  it("builds the posthog-js persistence cookie name", () => {
    expect(getPostHogCookieName("phc_abc123")).toBe("ph_phc_abc123_posthog");
  });
});

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

describe("parsePostHogCookieDistinctId", () => {
  it("parses a URL-encoded JSON cookie value", () => {
    const value = encodeURIComponent(
      JSON.stringify({ distinct_id: "0198c0de-anon", $sesid: [123, "abc"] }),
    );
    expect(parsePostHogCookieDistinctId(value)).toBe("0198c0de-anon");
  });

  it("parses an already-decoded JSON cookie value", () => {
    const value = JSON.stringify({ distinct_id: "anon-id" });
    expect(parsePostHogCookieDistinctId(value)).toBe("anon-id");
  });

  it("parses a decoded value containing a literal percent sign", () => {
    const value = JSON.stringify({
      distinct_id: "anon-id",
      $initial_referrer: "https://example.com/?q=100%",
    });
    expect(parsePostHogCookieDistinctId(value)).toBe("anon-id");
  });

  it("returns null for undefined", () => {
    expect(parsePostHogCookieDistinctId(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parsePostHogCookieDistinctId("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parsePostHogCookieDistinctId("not-json")).toBeNull();
    expect(parsePostHogCookieDistinctId("%7Bbroken")).toBeNull();
  });

  it("returns null for JSON without a distinct_id", () => {
    expect(
      parsePostHogCookieDistinctId(JSON.stringify({ $sesid: [1, "a"] })),
    ).toBeNull();
  });

  it("returns null for a non-string distinct_id", () => {
    expect(
      parsePostHogCookieDistinctId(JSON.stringify({ distinct_id: 42 })),
    ).toBeNull();
  });

  it("returns null for an empty distinct_id", () => {
    expect(
      parsePostHogCookieDistinctId(JSON.stringify({ distinct_id: "" })),
    ).toBeNull();
  });

  it("returns null for non-object JSON", () => {
    expect(parsePostHogCookieDistinctId('"a string"')).toBeNull();
    expect(parsePostHogCookieDistinctId("null")).toBeNull();
  });
});
