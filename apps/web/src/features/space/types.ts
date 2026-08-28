import type {
  MemberRole,
  SpaceContentVisibility,
} from "@/features/space/schema";

// Tenant scope proven by auth. Minted only by the session gate and the API
// key middleware; parameterized DAL reads require it.
export type AuthorizedSpaceId = string & {
  readonly __brand: "AuthorizedSpaceId";
};

// Visibility scope for space-scoped content reads. Built from the session
// via createSpaceContentScope (spaceProcedure, loaders); API key handlers
// mint { spaceId } directly — a space-level credential sees everything.
export type SpaceContentScope = {
  spaceId: AuthorizedSpaceId;
  // When set, reads must only return content created by this user: the
  // requester is a non-admin member of a space where members work
  // independently.
  createdBy?: string;
};

export type SpaceDTO = {
  id: AuthorizedSpaceId;
  name: string;
  ownerId: string;
  tier: "hobby" | "pro";
  role: MemberRole;
  contentVisibility: SpaceContentVisibility;
  memberCount: number;
  seatCount: number;
  image?: string;
  primaryColor?: string;
  showBranding: boolean;
  hideAttribution: boolean;
};
