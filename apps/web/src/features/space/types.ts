import type {
  MemberRole,
  SpaceContentVisibility,
} from "@/features/space/schema";
import type { AuthorizedSpaceId } from "@/lib/tenant-scope";

// Defined in lib so content features that space itself imports can use them
// without creating a feature cycle; re-exported here as the public path.
export type { AuthorizedSpaceId, SpaceContentScope } from "@/lib/tenant-scope";

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
