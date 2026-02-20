import { useUser } from "@/components/user-provider";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { useSpace } from "./client";

export function useMemberAbility() {
  const space = useSpace();
  const { user } = useUser();

  return defineAbilityForMember(
    user
      ? {
          user: { id: user.id },
          space: {
            id: space.data.id,
            ownerId: space.data.ownerId,
            role: space.data.role,
          },
        }
      : undefined,
  );
}
