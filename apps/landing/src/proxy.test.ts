import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MARKDOWN_CONTENT_TYPE } from "@/lib/markdown-negotiation";
import { proxy } from "./proxy";

function request(path: string, accept: string) {
  return new NextRequest(new URL(path, "https://rallly.co"), {
    headers: { accept },
  });
}

function stubProbe(
  probe: (...args: Parameters<typeof fetch>) => Promise<Response>,
) {
  const fetch = vi.fn(probe);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("proxy markdown negotiation", () => {
  it.each([
    "/",
    "/de",
  ])("rewrites %s to the Markdown homepage", async (path) => {
    const response = await proxy(request(path, "text/markdown"));
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://rallly.co/index.md",
    );
    expect(response.headers.get("vary")).toBe("Accept");
  });

  it("answers a missing page with a Markdown 404", async () => {
    const fetch = stubProbe(async () => new Response(null, { status: 404 }));
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const response = await proxy(request("/nope", "text/markdown"));
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://rallly.co/nope");
    expect(init).toMatchObject({
      method: "HEAD",
      headers: { accept: "text/html" },
      redirect: "manual",
    });
    expect(timeout).toHaveBeenCalledWith(3000);
    expect(init?.signal).toBe(timeout.mock.results[0]?.value);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe(MARKDOWN_CONTENT_TYPE);
    expect(response.headers.get("vary")).toBe("Accept");
    expect(await response.text()).toMatch(/^# Page not found/);
  });

  it("serves an existing page as usual", async () => {
    stubProbe(async () => new Response(null, { status: 200 }));
    const response = await proxy(request("/pricing", "text/markdown"));
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://rallly.co/en/pricing",
    );
  });

  it("serves the page as usual when the probe fails", async () => {
    stubProbe(async () => {
      throw new TypeError("fetch failed");
    });
    const response = await proxy(request("/pricing", "text/markdown"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://rallly.co/en/pricing",
    );
  });

  it("adds Accept to Vary on locale redirects", async () => {
    const response = await proxy(
      new NextRequest(new URL("/", "https://rallly.co"), {
        headers: { accept: "text/html", "accept-language": "de" },
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("vary")).toContain("Accept");
  });

  it("does not probe browser requests", async () => {
    const fetch = stubProbe(async () => new Response(null, { status: 404 }));
    const response = await proxy(
      request("/nope", "text/html,application/xhtml+xml,*/*;q=0.8"),
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://rallly.co/en/nope",
    );
  });
});
