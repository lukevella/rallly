import type { AssetProfile } from "@/lib/storage/asset-profile";

export const avatarAssetProfile = {
  id: "avatar",
  keyPrefix: "avatars",
  accept: ["image/jpeg", "image/png"],
  maxSize: 2 * 1024 * 1024,
} as const satisfies AssetProfile;

/**
 * Self-declared role. A property of the person, not the organization, so it
 * lives on User. The list mixes occupation with seniority on purpose:
 * "founder_or_owner" and the like are catch-alls meaning "no specific
 * occupation fits". Free text behind "other" is the instrument for building
 * a v2 list.
 */
export const jobTitles = [
  "executive_assistant",
  "administrator_or_coordinator",
  "manager_or_team_lead",
  "recruiter",
  "teacher_or_lecturer",
  "healthcare_practitioner",
  "consultant_or_freelancer",
  "founder_or_owner",
  "sales",
  "other",
] as const;

export type JobTitle = (typeof jobTitles)[number];

/**
 * Cap on the free text revealed by picking "other" for the role. Long enough
 * for a real job title, short enough that the values stay groupable.
 */
export const JOB_TITLE_OTHER_MAX_LENGTH = 100;
