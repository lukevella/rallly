import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

const request = (method: string, path: string) =>
  new NextRequest(new URL(path, "https://app.rallly.co"), { method });

describe("proxy", () => {
  it.each([
    "/invite/abc123",
    "/invite/abc123/vote",
    "/poll/abc123",
    "/unsubscribe/token",
  ])("answers HEAD %s without rendering", async (path) => {
    const res = await proxy(request("HEAD", path));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it.each([
    "/poll/abc123/edit",
    "/",
    "/settings/profile",
  ])("rewrites HEAD %s", async (path) => {
    const res = await proxy(request("HEAD", path));
    expect(res.headers.get("x-middleware-rewrite")).not.toBeNull();
  });

  it("rewrites GET /invite/abc123", async () => {
    const res = await proxy(request("GET", "/invite/abc123"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/invite/abc123");
  });
});

describe("proxy on the API host", () => {
  const apiRequest = (path: string) =>
    new NextRequest(new URL(path, "https://api.rallly.co"));

  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "https://api.rallly.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("answers / with a pointer to the API", async () => {
    const res = await proxy(apiRequest("/"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      baseUrl: "https://api.rallly.co/v1",
      docs: "https://support.rallly.co/api-reference/introduction",
    });
  });

  it.each([
    "/login",
    "/poll/abc123",
    "/settings/profile",
  ])("does not render the app at %s", async (path) => {
    const res = await proxy(apiRequest(path));
    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("still renders the app on the app host", async () => {
    const res = await proxy(request("GET", "/"));
    expect(res.headers.get("x-middleware-rewrite")).not.toBeNull();
  });
});
