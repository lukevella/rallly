import { createHash } from "node:crypto";
import { isSelfHosted } from "@/lib/constants";

/**
 * Builds a Gravatar URL for an email address. Returns `null` when no email is
 * provided, or for self-hosted instances — which often must keep personal data
 * (email hashes, client IPs) within the EU, so we don't send anything to a
 * third party there. `d=404` makes Gravatar respond with a 404 when no avatar
 * exists so the client falls back to initials.
 */
export function getGravatarUrl(email?: string | null) {
  if (!email || isSelfHosted) {
    return null;
  }

  const hash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");

  return `https://0.gravatar.com/avatar/${hash}?d=404&s=128&r=g`;
}
