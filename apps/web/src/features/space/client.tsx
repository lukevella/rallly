"use client";

import { posthog } from "@rallly/posthog/client";
import React from "react";
import { getPrimaryColorVars } from "@/features/branding/utils";
import { defineAbilityForMember } from "@/features/space/member/ability";
import type { SpaceDTO } from "@/features/space/types";
import { useAuthedUser } from "@/features/user/client";
import { defineAbilityForSpace } from "./ability";

const SpaceContext = React.createContext<SpaceDTO | null>(null);

export const useSpace = () => {
  const space = React.useContext(SpaceContext);
  const user = useAuthedUser();

  if (!space) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }

  return React.useMemo(
    () => ({
      data: space,
      getAbility: () => defineAbilityForSpace(space),
      getMemberAbility: () =>
        defineAbilityForMember({
          user: { id: user.id },
          space: {
            id: space.id,
            ownerId: space.ownerId,
            role: space.role,
          },
        }),
    }),
    [space, user.id],
  );
};

export function SpaceProvider({
  space,
  children,
}: {
  space: SpaceDTO;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    // No properties here — posthog-js captures $groupidentify on EVERY
    // group() call that passes properties (no diffing), which fired one
    // event per page load. Without properties it only fires when the
    // group key changes. Group properties are maintained by the
    // server-side identifyGroup calls on the mutations that change them.
    posthog?.group("space", space.id);
  }, [space.id]);

  const primaryColorVars =
    space.showBranding && space.primaryColor
      ? getPrimaryColorVars(space.primaryColor)
      : null;

  return (
    <SpaceContext.Provider value={space}>
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
    </SpaceContext.Provider>
  );
}
