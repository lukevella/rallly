/**
 * What this instance's organization decides for its spaces. Every field is
 * a cloud vs self-hosted behavior difference; there is no other place for
 * one. When the organization layer lands this becomes the org's policy:
 * same fields, new source.
 */
export type InstancePolicy = {
  // Every space is a team: independent membership does not exist
  spacesAlwaysShared: boolean;
  // Spaces may apply their own branding on top of the instance branding
  spaceBrandingAllowed: boolean;
  // Attribution removal is a per-space setting rather than instance wide
  spaceAttributionConfigurable: boolean;
};
