import { absoluteUrl } from "@rallly/utils/absolute-url";
import { env } from "@/env";

/**
 * Resolves a storage key to an absolute URL.
 *
 * 1. If the key is already an absolute URL (e.g. OAuth avatars) or a data URI → returned as-is.
 * 2. If `NEXT_PUBLIC_CDN_BASE_URL` is set → served directly from the CDN/bucket.
 * 3. Otherwise → proxied through `/api/storage/`.
 */
export function resolveStorageUrl(key: string): string {
  if (
    key.startsWith("https://") ||
    key.startsWith("http://") ||
    key.startsWith("data:")
  ) {
    return key;
  }

  const normalizedKey = key.replace(/^\/+/, "");

  if (env.NEXT_PUBLIC_CDN_BASE_URL) {
    const base = env.NEXT_PUBLIC_CDN_BASE_URL.replace(/\/+$/, "");
    return `${base}/${normalizedKey}`;
  }

  return absoluteUrl(`/api/storage/${normalizedKey}`);
}
