/**
 * Declarative policy for one asset slot (avatar, space icon, branding logo…).
 *
 * A profile is the single source of truth for what a slot accepts: the
 * feature that owns the slot declares it, actions derive their input schemas
 * from it, `createAssetUploadUrl` validates against it at sign time, the
 * self-hosted upload route re-derives the expected content type from it, and
 * the upload control reads it for client-side validation and hint copy.
 *
 * The storage core is media-agnostic: nothing here branches on whether the
 * bytes are pixels. `crop` is data for the UI edge only.
 */
export interface AssetProfile {
  id: string;
  /**
   * First segment(s) of the storage key. Stable forever — persisted keys in
   * the database carry it. Profiles may share a prefix only if they declare
   * disjoint `entityIds`.
   */
  keyPrefix: string;
  /**
   * Fixed entity ids for singleton slots (e.g. the instance branding logos).
   * Unset means the entity id is caller-scoped (a user or space id).
   */
  entityIds?: readonly string[];
  /** Mime types this slot accepts. */
  accept: readonly [string, ...string[]];
  /** Maximum file size in bytes. */
  maxSize: number;
  /**
   * UI edge hint: run the selected file through the 1:1 crop dialog before
   * uploading. Only raster types can be cropped (the crop canvas cannot
   * process SVG), so `crop: true` requires a raster-only `accept` list.
   */
  crop: boolean;
}

export const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
};

export interface ParsedAssetKey {
  profile: AssetProfile;
  entityId: string;
  /** The accept-list mime type matching the key's extension. */
  mimeType: string;
}

const keyFileNamePattern = /^(.+)-(\d+)\.([a-z0-9]+)$/;

/**
 * Resolves a storage key (`prefix/entityId-timestamp.ext`) to the profile
 * that produced it. Returns null for keys that no known profile could have
 * signed.
 */
export function parseAssetKey(
  key: string,
  profiles: readonly AssetProfile[],
): ParsedAssetKey | null {
  const segments = key.split("/");
  if (segments.length < 2) {
    return null;
  }

  const fileName = segments[segments.length - 1];
  const keyPrefix = segments.slice(0, -1).join("/");

  const match = fileName.match(keyFileNamePattern);
  if (!match) {
    return null;
  }
  const [, entityId, , extension] = match;

  for (const profile of profiles) {
    if (profile.keyPrefix !== keyPrefix) {
      continue;
    }
    if (profile.entityIds && !profile.entityIds.includes(entityId)) {
      continue;
    }
    const mimeType = profile.accept.find(
      (type) => extensionByMimeType[type] === extension,
    );
    if (!mimeType) {
      continue;
    }
    return { profile, entityId, mimeType };
  }

  return null;
}

export type AssetValidationError = "invalidFileType" | "fileTooLarge";

export type AssetValidationResult =
  | { success: true }
  | { success: false; error: AssetValidationError };

export function validateAssetFile(
  file: { type: string; size: number },
  profile: AssetProfile,
): AssetValidationResult {
  if (!profile.accept.includes(file.type)) {
    return { success: false, error: "invalidFileType" };
  }
  if (file.size > profile.maxSize) {
    return { success: false, error: "fileTooLarge" };
  }
  return { success: true };
}
