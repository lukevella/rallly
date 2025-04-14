"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";

import { Trans } from "@/components/trans";

export const SignOutButton = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        signOut({
          redirectTo: "/",
        });
      }}
    >
      <Icon>
        <LogOutIcon />
      </Icon>
      <Trans i18nKey="signOut" defaults="Sign Out" />
    </Button>
  );
};
