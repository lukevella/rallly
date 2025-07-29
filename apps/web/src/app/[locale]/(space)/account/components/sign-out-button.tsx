"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Icon } from "@rallly/ui/icon";
import { SidebarMenuButton } from "@rallly/ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import React from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { Trans } from "@/components/trans";

export const SignOutButton = () => {
  const posthog = usePostHog();
  const [isPending, startTransition] = React.useTransition();
  return (
    <>
      {isPending && <RouterLoadingIndicator />}
      <SidebarMenuButton
        onClick={() => {
          startTransition(async () => {
            await signOut({
              redirectTo: "/",
            });
            posthog?.reset();
          });
        }}
      >
        <Icon>
          <LogOutIcon />
        </Icon>
        <Trans i18nKey="signOut" defaults="Sign Out" />
      </SidebarMenuButton>
    </>
  );
};
