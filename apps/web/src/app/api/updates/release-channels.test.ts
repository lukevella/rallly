import { describe, expect, it } from "vitest";
import {
  buildReleaseChannels,
  buildUpdatesPayload,
  isSecurityRelease,
  parseAffectedMajors,
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

function securityRelease(
  tag: string,
  publishedAt = "2026-01-01T00:00:00Z",
  affected?: string,
) {
  return release(tag, {
    body: `## 🔒 Security release\n\n${
      affected ? `Affected versions: ${affected}\n\n` : ""
    }Upgrade promptly.`,
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

describe("parseAffectedMajors", () => {
  it("reads majors from an affected versions line in any common spelling", () => {
    expect(parseAffectedMajors("Affected versions: 4.x, 5.x")).toEqual([4, 5]);
    expect(parseAffectedMajors("affected version: v4 and v5")).toEqual([4, 5]);
    expect(parseAffectedMajors("Affected versions: 4.13.0 to 5.1.0")).toEqual([
      4, 5,
    ]);
  });

  it("returns nothing without the line", () => {
    expect(parseAffectedMajors("## Security release\n\nFixes 4.x")).toEqual([]);
    expect(parseAffectedMajors(null)).toEqual([]);
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

  it("always counts a release's own major as affected", () => {
    const channels = buildReleaseChannels([
      securityRelease("v5.0.1"),
      securityRelease("v6.0.1", "2026-01-01T00:00:00Z", "4.x, 5.x"),
    ]);

    expect(channels?.securityReleases.map((r) => r.affectedMajors)).toEqual([
      [5],
      [6, 4, 5],
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

  it("does not flag the new-major notice for a security release scoped to the newer major", () => {
    const payload = buildUpdatesPayload(channels, "3.9.0");
    expect(payload.latest).toBe("v3.9.0");
    expect(payload.security).toBe(false);
    expect(payload.newMajor).toEqual({
      version: "v4.15.1",
      migrationGuideUrl: "https://support.rallly.co/self-hosting/migrate-to-v4",
      security: false,
    });
  });

  it("flags the new-major notice when the release lists the caller's major as affected", () => {
    const affected = buildReleaseChannels([
      release("v3.9.0", { published_at: "2025-06-01T00:00:00Z" }),
      securityRelease("v4.13.1", "2026-08-25T00:00:00Z", "3.x, 4.x"),
    ]);
    if (!affected) throw new Error("fixture failed to build");

    const payload = buildUpdatesPayload(affected, "3.9.0");
    expect(payload.newMajor?.security).toBe(true);
    expect(buildUpdatesPayload(affected, "2.0.0").newMajor?.security).toBe(
      false,
    );
  });

  it("hands over to the within-channel flag once the caller's major ships its own security release", () => {
    const backported = buildReleaseChannels([
      release("v3.9.0", { published_at: "2025-06-01T00:00:00Z" }),
      securityRelease("v4.13.1", "2026-08-25T00:00:00Z", "3.x, 4.x"),
      securityRelease("v3.9.1", "2026-08-26T00:00:00Z"),
    ]);
    if (!backported) throw new Error("fixture failed to build");

    expect(buildUpdatesPayload(backported, "3.9.0")).toMatchObject({
      latest: "v3.9.1",
      security: true,
      newMajor: { security: false },
    });
    expect(buildUpdatesPayload(backported, "3.9.1")).toMatchObject({
      security: false,
      newMajor: { security: false },
    });
  });
});
