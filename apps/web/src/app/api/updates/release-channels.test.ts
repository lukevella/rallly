import { describe, expect, it } from "vitest";
import {
  buildReleaseChannels,
  buildUpdatesPayload,
  isSecurityRelease,
} from "./release-channels";

function release(tag: string, overrides: Record<string, unknown> = {}) {
  return {
    tag_name: tag,
    html_url: `https://github.com/lukevella/rallly/releases/tag/${tag}`,
    published_at: "2026-01-01T00:00:00Z",
    body: "### What's Changed\n- Fix a typo",
    draft: false,
    prerelease: false,
    ...overrides,
  };
}

function securityRelease(tag: string, publishedAt = "2026-01-01T00:00:00Z") {
  return release(tag, {
    body: "## 🔒 Security release\n\nUpgrade promptly.",
    published_at: publishedAt,
  });
}

describe("buildReleaseChannels", () => {
  it("keeps the newest release per major regardless of list order", () => {
    const channels = buildReleaseChannels([
      release("v4.2.0"),
      release("v5.0.0"),
      release("v4.10.0"),
      release("v4.1.0"),
      release("v5.1.0"),
    ]);

    expect(channels).not.toBeNull();
    expect(channels?.latestByMajor[4]?.version).toBe("v4.10.0");
    expect(channels?.latestByMajor[5]?.version).toBe("v5.1.0");
    expect(channels?.latestMajor).toBe(5);
  });

  it("excludes drafts, prereleases, and non-stable tags", () => {
    const channels = buildReleaseChannels([
      release("v4.1.0"),
      release("v6.0.0", { draft: true }),
      release("v5.0.0", { prerelease: true }),
      release("v5.0.0-beta.1"),
      release("4-beta"),
    ]);

    expect(channels?.latestMajor).toBe(4);
    expect(channels?.latestByMajor[5]).toBeUndefined();
    expect(channels?.latestByMajor[6]).toBeUndefined();
  });

  it("skips releases without a published date", () => {
    const channels = buildReleaseChannels([
      release("v4.1.0"),
      release("v5.0.0", { published_at: null }),
    ]);

    expect(channels?.latestMajor).toBe(4);
  });

  it("skips malformed entries instead of failing the list", () => {
    const channels = buildReleaseChannels([
      null,
      {},
      { tag_name: "v9.0.0" },
      release("v4.1.0"),
    ]);

    expect(channels?.latestMajor).toBe(4);
    expect(channels?.latestByMajor[4]?.version).toBe("v4.1.0");
  });

  it("returns null when nothing usable remains", () => {
    expect(buildReleaseChannels([])).toBeNull();
    expect(buildReleaseChannels([release("nightly")])).toBeNull();
    expect(buildReleaseChannels({ not: "an array" })).toBeNull();
  });
});

describe("isSecurityRelease", () => {
  it("matches a security release heading at any level with any prefix", () => {
    expect(isSecurityRelease("## 🔒 Security release\n\nDetails")).toBe(true);
    expect(isSecurityRelease("# Security Release")).toBe(true);
    expect(isSecurityRelease("Intro\n\n### security release notes")).toBe(true);
  });

  it("ignores the phrase outside a heading", () => {
    expect(isSecurityRelease("This is not a security release.")).toBe(false);
    expect(isSecurityRelease("## Security\n\nHardening only")).toBe(false);
    expect(isSecurityRelease(null)).toBe(false);
    expect(isSecurityRelease("")).toBe(false);
  });
});

describe("buildReleaseChannels security releases", () => {
  it("collects stable security releases across majors", () => {
    const channels = buildReleaseChannels([
      release("v4.12.0"),
      securityRelease("v4.13.1"),
      securityRelease("v5.0.1"),
      release("v5.0.2-beta.1", { body: "## Security release" }),
      release("v6.0.0", { draft: true, body: "## Security release" }),
    ]);

    expect(channels?.securityReleases.map((r) => r.version)).toEqual([
      "v4.13.1",
      "v5.0.1",
    ]);
  });
});

describe("buildUpdatesPayload", () => {
  const channels = buildReleaseChannels([
    release("v3.9.0", { published_at: "2025-06-01T00:00:00Z" }),
    release("v4.12.0", { published_at: "2026-08-01T00:00:00Z" }),
    securityRelease("v4.13.1", "2026-08-25T00:00:00Z"),
    release("v4.15.1", { published_at: "2026-09-13T00:00:00Z" }),
  ]);
  if (!channels) throw new Error("fixture failed to build");

  it("flags security when a security release sits between the caller and latest", () => {
    const payload = buildUpdatesPayload(channels, "4.12.0");
    expect(payload.latest).toBe("v4.15.1");
    expect(payload.security).toBe(true);
  });

  it("does not flag security when the caller already has the fix", () => {
    expect(buildUpdatesPayload(channels, "4.13.1").security).toBe(false);
    expect(buildUpdatesPayload(channels, "4.14.0").security).toBe(false);
    expect(buildUpdatesPayload(channels, "4.15.1").security).toBe(false);
  });

  it("does not flag security without a caller version", () => {
    const payload = buildUpdatesPayload(channels, null);
    expect(payload.latest).toBe("v4.15.1");
    expect(payload.security).toBe(false);
    expect(payload.newMajor).toBeUndefined();
  });

  it("flags the new-major notice when the caller's major shipped nothing after the fix", () => {
    const payload = buildUpdatesPayload(channels, "3.9.0");
    expect(payload.latest).toBe("v3.9.0");
    expect(payload.security).toBe(false);
    expect(payload.newMajor).toEqual({
      version: "v4.15.1",
      migrationGuideUrl: "https://support.rallly.co/self-hosting/migrate-to-v4",
      security: true,
    });
  });

  it("does not flag the new-major notice when the caller's major shipped after the fix", () => {
    const backported = buildReleaseChannels([
      release("v3.9.0", { published_at: "2025-06-01T00:00:00Z" }),
      securityRelease("v4.13.1", "2026-08-25T00:00:00Z"),
      release("v3.9.1", { published_at: "2026-08-26T00:00:00Z" }),
    ]);
    if (!backported) throw new Error("fixture failed to build");

    const payload = buildUpdatesPayload(backported, "3.9.0");
    expect(payload.latest).toBe("v3.9.1");
    expect(payload.newMajor?.security).toBe(false);
  });

  it("flags the new-major notice when the caller's major has no channel at all", () => {
    const payload = buildUpdatesPayload(channels, "2.0.0");
    expect(payload.latest).toBeNull();
    expect(payload.newMajor?.security).toBe(true);
  });
});
