import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
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
