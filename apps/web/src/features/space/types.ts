import type { MemberRole } from "@/features/space/schema";

/**
 * A space id whose tenant scope has been proven by authentication. Only the
 * session gate (createSpaceDTO) and the API key middleware mint this brand;
 * parameterized DAL reads require it so a bare resource id can never be
 * trusted (RAL-1333).
 */
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
