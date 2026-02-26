"use client";

import { usePostHog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import React from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { useUser } from "@/components/user-provider";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { trpc } from "@/trpc/client";
import { defineAbilityForSpace } from "./ability";

export const useSpace = () => {
  const { user } = useUser();
  const [data] = trpc.space.getCurrent.useSuspenseQuery();

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
  const router = useRouter();
  const { data: space, isLoading } = trpc.space.getCurrent.useQuery();
  const posthog = usePostHog();

  React.useEffect(() => {
    if (!isLoading && !space) {
      router.replace("/setup");
    }
  }, [isLoading, space, router]);

  React.useEffect(() => {
    if (space?.id) {
      posthog?.group("space", space.id, {
        name: space.name,
        tier: space.tier,
      });
    }
  }, [posthog, space?.id, space?.name, space?.tier]);

  if (!space) {
    return <RouterLoadingIndicator />;
  }

  return <>{children}</>;
}
