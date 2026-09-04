// One-shot UI intent carried across a navigation, in the spirit of Remix's
// session.flash(): set before the redirect, read once on the next page, gone.
// Host-only and script-readable so the consuming client can clear it; the TTL
// bounds a flash nothing ever consumed. Consumers own their keys.
export const FLASH_MAX_AGE = 5 * 60;

export function flashCookieName(key: string) {
  return `rallly_flash_${key}`;
}
