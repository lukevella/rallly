import type { MemberRole } from "@/features/space/schema";

export type MemberDTO = {
  id: string;
  name: string;
  email: string;
  userId: string;
  spaceId: string;
  image?: string;
  role: MemberRole;
  isOwner: boolean;
};
