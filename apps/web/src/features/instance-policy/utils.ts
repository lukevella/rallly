import type { InstancePolicy } from "./types";

/**
 * The one derivation of instance policy from deployment facts. Each field
 * is one line with its reason, so this function is the inventory of what
 * differs between cloud and self-hosted at the policy level.
 */
export function deriveInstancePolicy({
  isSelfHosted,
  whiteLabelAddon,
}: {
  isSelfHosted: boolean;
  whiteLabelAddon: boolean;
}): InstancePolicy {
  return {
    // Single-tenant instance: the instance is the org boundary, so adding a
    // member to a space only makes sense to collaborate
    spacesAlwaysShared: isSelfHosted,
    // A white label instance is branded by its operator
    spaceBrandingAllowed: !whiteLabelAddon,
    // Self-hosted attribution is licensed at instance level (white label
    // addon + HIDE_ATTRIBUTION), not chosen per space
    spaceAttributionConfigurable: !isSelfHosted,
    // The same on both today. "email" is the OTP and password logins, both
    // proven by mail to the address; Google asserts email_verified.
    // Microsoft accounts are keyed on oid with an address the tenant sets,
    // and an OIDC directory may omit email_verified, so neither is trusted
    responseEmailLoginMethods: ["email", "google"],
  };
}
