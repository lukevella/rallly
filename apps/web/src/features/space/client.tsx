"use client";

import { posthog } from "@rallly/posthog/client";
import { useRouter } from "next/navigation";
import React from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { getPrimaryColorVars } from "@/features/branding/color";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { trpc } from "@/trpc/client";
import { defineAbilityForSpace } from "./ability";

export const useSpace = () => {
  const [user] = trpc.user.getAuthed.useSuspenseQuery();
  const [data] = trpc.spaces.getCurrent.useSuspenseQuery();

  if (!data) {
    throw new Error("No active space found");
  }

  return React.useMemo(
    () => ({
      data,
      getAbility: () => defineAbilityForSpace(data),
      getMemberAbility: () =>
        defineAbilityForMember({
          user: { id: user.id },
          space: {
            id: data.id,
            ownerId: data.ownerId,
            role: data.role,
          },
        }),
    }),
    [data, user.id],
  );
};

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: space, isLoading } = trpc.spaces.getCurrent.useQuery();

  React.useEffect(() => {
    if (!isLoading && !space) {
      router.replace("/setup");
    }
  }, [isLoading, space, router]);

  React.useEffect(() => {
    if (space?.id) {
      posthog?.group("space", space.id);
    }
  }, [space?.id]);

  if (!space) {
    return <RouterLoadingIndicator />;
  }

  const primaryColorVars =
    space.showBranding && space.primaryColor
      ? getPrimaryColorVars(space.primaryColor)
      : null;

  return (
    <div data-space-branding style={{ display: "contents" }}>
      {primaryColorVars ? (
        <style>{`
          html.light [data-space-branding] {
            --primary: ${primaryColorVars.light};
            --primary-foreground: ${primaryColorVars.lightForeground};
          }
          html.dark [data-space-branding] {
            --primary: ${primaryColorVars.dark};
            --primary-foreground: ${primaryColorVars.darkForeground};
          }
        `}</style>
      ) : null}
      {children}
    </div>
  );
}
