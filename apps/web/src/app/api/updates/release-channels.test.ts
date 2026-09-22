import { describe, expect, it } from "vitest";
import { buildReleaseChannels, buildUpdatesPayload } from "./release-channels";
import { buildSecurityAdvisories } from "./security-advisories";

function release(tag: string, overrides: Record<string, unknown> = {}) {
  return {
    tag_name: tag,
    html_url: `https://github.com/lukevella/rallly/releases/tag/${tag}`,
    published_at: "2026-01-01T00:00:00Z",
    draft: false,
    prerelease: false,
    ...overrides,
  };
}

function advisories(...ranges: string[]) {
  return buildSecurityAdvisories(
    ranges.map((range, i) => ({
      ghsa_id: `GHSA-${i}`,
      html_url: `https://github.com/lukevella/rallly/security/advisories/GHSA-${i}`,
      severity: "high",
      vulnerabilities: [{ vulnerable_version_range: range }],
    })),
  );
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

describe("buildUpdatesPayload", () => {
  const built = buildReleaseChannels([
    release("v3.9.0"),
    release("v4.12.0"),
    release("v4.13.1"),
    release("v4.15.1"),
  ]);
  if (!built) throw new Error("fixture failed to build");
  const channels = built;

  function payload(requestedVersion: string | null, ...ranges: string[]) {
    return buildUpdatesPayload({
      channels,
      advisories: advisories(...ranges),
      requestedVersion,
    });
  }

  it("flags security when the caller is inside a range the channel update fixes", () => {
    const result = payload("4.12.0", "< 4.13.1");
    expect(result.latest).toBe("v4.15.1");
    expect(result.security).toBe(true);
    expect(result.advisories).toEqual([
      {
        ghsaId: "GHSA-0",
        url: "https://github.com/lukevella/rallly/security/advisories/GHSA-0",
        severity: "high",
      },
    ]);
  });

  it("does not flag security when the caller is outside every range", () => {
    expect(payload("4.13.1", "< 4.13.1").security).toBe(false);
    expect(payload("4.15.1", "< 4.13.1").security).toBe(false);
    expect(payload("4.12.0").security).toBe(false);
  });

  it("does not flag security without a caller version", () => {
    const result = payload(null, "< 4.13.1");
    expect(result.latest).toBe("v4.15.1");
    expect(result.security).toBe(false);
    expect(result.newMajor).toBeUndefined();
  });

  it("does not flag the new-major notice for a range confined to the newer major", () => {
    const result = payload("3.9.0", ">= 4.0.0, < 4.13.1");
    expect(result.latest).toBe("v3.9.0");
    expect(result.security).toBe(false);
    expect(result.newMajor).toEqual({
      version: "v4.15.1",
      migrationGuideUrl: "https://support.rallly.co/self-hosting/migrate-to-v4",
      security: false,
      advisories: [],
    });
  });

  it("flags the new-major notice when only the newer major is outside the range", () => {
    const result = payload("3.9.0", "< 4.13.1");
    expect(result.security).toBe(false);
    expect(result.advisories).toEqual([]);
    expect(result.newMajor?.security).toBe(true);
    expect(result.newMajor?.advisories.map((a) => a.ghsaId)).toEqual([
      "GHSA-0",
    ]);
  });

  it("flags the new-major notice when the caller's major has no channel at all", () => {
    const result = payload("2.0.0", "< 4.13.1");
    expect(result.latest).toBeNull();
    expect(result.newMajor?.security).toBe(true);
  });

  it("prefers the channel update over the new major when both fix it", () => {
    const backported = buildReleaseChannels([
      release("v3.9.0"),
      release("v3.9.1"),
      release("v4.13.1"),
    ]);
    if (!backported) throw new Error("fixture failed to build");

    expect(
      buildUpdatesPayload({
        channels: backported,
        advisories: advisories(">= 4.0.0, < 4.13.1", "< 3.9.1"),
        requestedVersion: "3.9.0",
      }),
    ).toMatchObject({
      latest: "v3.9.1",
      security: true,
      newMajor: { security: false },
    });
  });

  it("stays quiet when nothing published fixes the range", () => {
    const result = payload("4.15.1", "< 5.0.0");
    expect(result.security).toBe(false);
    expect(result.newMajor).toBeUndefined();
  });
});
