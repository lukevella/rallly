"use client";

import { toast } from "@rallly/ui/sonner";
import React from "react";
import type { PayWallTrigger } from "@/features/billing/client";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { getPrimaryColorVars } from "@/features/branding/utils";
import { useInstancePolicy } from "@/features/instance-policy/client";
import { defineAbilityForMember } from "@/features/space/member/ability";
import type { SpaceDTO } from "@/features/space/types";
import { isSpaceBrandingActive } from "@/features/space/utils";
import { useAuthedUser } from "@/features/user/client";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { defineAbilityForSpace } from "./ability";
import { updateSpaceHideAttributionAction } from "./actions";

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
  const { spaceBrandingAllowed } = useInstancePolicy();

  const primaryColorVars =
    isSpaceBrandingActive({ ...space, spaceBrandingAllowed }) &&
    space.primaryColor
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

/**
 * The "remove attribution" toggle, shared by the general settings row and
 * the poll footer popover so the plan gate lives in one place: turning it
 * on in a free space opens the pay wall instead of calling the action.
 */
export function useHideAttributionToggle({
  hideAttribution,
  payWallTrigger,
}: {
  hideAttribution: boolean;
  payWallTrigger: PayWallTrigger;
}) {
  const isFree = useIsFree();
  const { t } = useTranslation();
  const updateHideAttribution = useSafeAction(updateSpaceHideAttributionAction);

  // Optimistic value shown until the post-action router refresh delivers
  // the updated space data; reverts automatically if the action fails.
  const [optimisticValue, setOptimisticValue] =
    React.useOptimistic(hideAttribution);

  const toggle = (newChecked: boolean) => {
    if (isFree && newChecked) {
      showPayWall(payWallTrigger);
      return;
    }

    React.startTransition(async () => {
      setOptimisticValue(newChecked);
      const result = await updateHideAttribution.executeAsync({
        hideAttribution: newChecked,
      });

      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t("saved", { defaultValue: "Saved" }));
      }
    });
  };

  return {
    hideAttribution: optimisticValue,
    isExecuting: updateHideAttribution.isExecuting,
    toggle,
  };
}
