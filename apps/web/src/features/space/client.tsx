"use client";

import { usePostHog } from "@rallly/posthog/client";
import React from "react";
import { useUser } from "@/components/user-provider";
import { defineAbilityForMember } from "@/features/space/member/ability";
import type { SpaceDTO } from "@/features/space/types";
import { trpc } from "@/trpc/client";
import { defineAbilityForSpace } from "./ability";

const defaultSpace: SpaceDTO = {
  id: "",
  name: "",
  ownerId: "system",
  role: "member",
  tier: "hobby",
};

export const useSpace = () => {
  const { user } = useUser();
  const { data: space } = trpc.space.getCurrent.useSuspenseQuery();

  const data = space ?? defaultSpace;
  const userId = user?.id;

  return React.useMemo(
    () => ({
      data,
      getAbility: () => defineAbilityForSpace(data),
      getMemberAbility: () =>
        defineAbilityForMember(
          userId
            ? {
                user: { id: userId },
                space: {
                  id: data.id,
                  ownerId: data.ownerId,
                  role: data.role,
                },
              }
            : undefined,
        ),
    }),
    [data, userId],
  );
};

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { data: space } = useSpace();
  const posthog = usePostHog();

  React.useEffect(() => {
    if (space.id) {
      posthog?.group("space", space.id, {
        name: space.name,
        tier: space.tier,
      });
    }
  }, [posthog, space.id, space.name, space.tier]);

  return children;
}
