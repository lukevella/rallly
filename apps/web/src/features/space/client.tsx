"use client";

import { usePostHog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import React from "react";
import { useUser } from "@/components/user-provider";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { trpc } from "@/trpc/client";
import { defineAbilityForSpace } from "./ability";

export const useSpace = () => {
  const { user } = useUser();
  const router = useRouter();
  const [data] = trpc.space.getCurrent.useSuspenseQuery();

  React.useEffect(() => {
    if (!data) {
      router.replace("/setup");
    }
  }, [data, router]);

  if (!data) {
    throw new Error("No active space found");
  }

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
