import { describe, expect, it } from "vitest";
import type { AssetProfile } from "./asset-profile";
import { parseAssetKey, validateAssetFile } from "./asset-profile";

const avatarProfile = {
  id: "avatar",
  keyPrefix: "avatars",
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
  crop: true,
} as const satisfies AssetProfile;

const wordmarkProfile = {
  id: "branding-logo",
  keyPrefix: "branding",
  entityIds: ["logo", "logo-dark"],
  accept: ["image/jpeg", "image/png", "image/svg+xml"],
  maxSize: 2 * 1024 * 1024,
  crop: false,
} as const satisfies AssetProfile;

const iconProfile = {
  id: "branding-logo-icon",
  keyPrefix: "branding",
  entityIds: ["logo-icon"],
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
  crop: false,
} as const satisfies AssetProfile;

const profiles = [avatarProfile, wordmarkProfile, iconProfile];

describe("parseAssetKey", () => {
  it("parses a key into its profile, entity id and mime type", () => {
    expect(
      parseAssetKey("avatars/user123-1723800000000.jpg", profiles),
    ).toEqual({
      profile: avatarProfile,
      entityId: "user123",
      mimeType: "image/jpeg",
    });
  });

  it("disambiguates profiles sharing a prefix by entity id", () => {
    expect(
      parseAssetKey("branding/logo-dark-1723800000000.svg", profiles)?.profile,
    ).toBe(wordmarkProfile);
    expect(
      parseAssetKey("branding/logo-icon-1723800000000.png", profiles)?.profile,
    ).toBe(iconProfile);
  });

  it("keeps dashes inside the entity id", () => {
    expect(
      parseAssetKey("branding/logo-dark-1723800000000.svg", profiles)?.entityId,
    ).toBe("logo-dark");
  });

  it("rejects keys whose prefix matches no profile", () => {
    expect(parseAssetKey("polls/abc-1723800000000.jpg", profiles)).toBeNull();
    expect(parseAssetKey("abc-1723800000000.jpg", profiles)).toBeNull();
  });

  it("rejects entity ids outside a profile's fixed set", () => {
    expect(
      parseAssetKey("branding/other-1723800000000.png", profiles),
    ).toBeNull();
  });

  it("rejects extensions outside the profile's accept list", () => {
    expect(
      parseAssetKey("avatars/user123-1723800000000.svg", profiles),
    ).toBeNull();
    expect(
      parseAssetKey("branding/logo-icon-1723800000000.svg", profiles),
    ).toBeNull();
  });

  it("rejects malformed keys", () => {
    expect(parseAssetKey("avatars/user123.jpg", profiles)).toBeNull();
    expect(
      parseAssetKey("avatars/user123-notatimestamp.jpg", profiles),
    ).toBeNull();
    expect(parseAssetKey("avatars/user123-1723800000000", profiles)).toBeNull();
    expect(parseAssetKey("", profiles)).toBeNull();
  });
});

describe("validateAssetFile", () => {
  it("accepts a file matching the profile", () => {
    expect(
      validateAssetFile({ type: "image/png", size: 1024 }, avatarProfile),
    ).toEqual({ success: true });
  });

  it("rejects a mime type outside the accept list", () => {
    expect(
      validateAssetFile({ type: "image/svg+xml", size: 1024 }, avatarProfile),
    ).toEqual({ success: false, error: "invalidFileType" });
  });

  it("rejects files over the size cap", () => {
    expect(
      validateAssetFile(
        { type: "image/png", size: avatarProfile.maxSize + 1 },
        avatarProfile,
      ),
    ).toEqual({ success: false, error: "fileTooLarge" });
  });
});
