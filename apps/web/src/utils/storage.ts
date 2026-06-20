import { absoluteUrl } from "@rallly/utils/absolute-url";

/**
 * Resolves a storage key to an absolute URL.
 *
 * 1. If the key is already an absolute URL (e.g. OAuth avatars) or a data URI → returned as-is.
 * 2. If `NEXT_PUBLIC_CDN_BASE_URL` is set → served directly from the CDN/bucket.
 * 3. Otherwise → proxied through `/api/storage/`.
 *
 * Reads `process.env` directly rather than the validated `env` object so this
 * stays safe to import from client components (same pattern as absolute-url.ts).
 * Importing `@/env` here pulls its client-side validation into the browser
 * bundle, which crashes self-hosted builds where `NEXT_PUBLIC_BASE_URL` is set
 * at runtime and is therefore absent on the client.
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

  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  if (cdnBaseUrl) {
    const base = cdnBaseUrl.replace(/\/+$/, "");
    return `${base}/${normalizedKey}`;
  }

  return absoluteUrl(`/api/storage/${normalizedKey}`);
}
