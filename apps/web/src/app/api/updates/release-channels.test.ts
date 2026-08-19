import { describe, expect, it } from "vitest";
import { buildReleaseChannels } from "./release-channels";

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
