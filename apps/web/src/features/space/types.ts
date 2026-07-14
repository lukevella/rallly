import type { MemberRole } from "@/features/space/schema";

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
  image?: string;
  primaryColor?: string;
  showBranding: boolean;
};
