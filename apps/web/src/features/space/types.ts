import type { Industry } from "@/features/space/constants";
import type { MemberRole, SpaceType } from "@/features/space/schema";

// Tenant scope proven by auth. Minted only by the session gate and the API
// key middleware; parameterized DAL reads require it.
export type AuthorizedSpaceId = string & {
  readonly __brand: "AuthorizedSpaceId";
};

export type SpaceDTO = {
  id: AuthorizedSpaceId;
  name: string;
  ownerId: string;
  tier: "hobby" | "pro";
  role: MemberRole;
  memberCount: number;
  seatCount: number;
  image?: string;
  primaryColor?: string;
  showBranding: boolean;
  hideAttribution: boolean;
  spaceType?: SpaceType;
  // Undefined when unanswered, or when the stored value predates the current
  // taxonomy — a v2 rename leaves rows behind, and an unrecognised value is
  // no answer as far as the UI is concerned.
  industry?: Industry;
};
