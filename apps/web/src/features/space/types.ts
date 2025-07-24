import type { MemberRole } from "@/features/space/schema";

export type SpaceDTO = {
  id: string;
  name: string;
  ownerId: string;
  tier: "hobby" | "pro";
  role: MemberRole;
};
