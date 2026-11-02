import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MARKDOWN_CONTENT_TYPE } from "@/lib/markdown-negotiation";
import { proxy } from "./proxy";

function request(path: string, accept: string) {
  return new NextRequest(new URL(path, "https://rallly.co"), {
    headers: { accept },
  });
}

function stubProbe(probe: () => Promise<Response>) {
  const fetch = vi.fn(probe);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
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
    stubProbe(async () => new Response(null, { status: 404 }));
    const response = await proxy(request("/nope", "text/markdown"));
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
