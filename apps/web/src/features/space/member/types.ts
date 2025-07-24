import type { SpaceMemberRole } from "@/features/space/schema";

export type MemberDTO = {
  userId: string;
  spaceId: string;
  role: SpaceMemberRole;
};
