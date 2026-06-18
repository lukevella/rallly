import { createHash } from "node:crypto";

/**
 * Builds a Gravatar URL for an email address. Returns `null` when no email is
 * provided. `d=404` makes Gravatar respond with a 404 when no avatar exists so
 * the client falls back to initials.
 */
export function getGravatarUrl(email?: string | null) {
  if (!email) {
    return null;
  }

  const hash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");

  return `https://0.gravatar.com/avatar/${hash}?d=404&s=128&r=g`;
}
