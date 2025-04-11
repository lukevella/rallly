"use client";

import { Button } from "@rallly/ui/button";
import { Trans } from "@/components/trans";
import { signOut } from "next-auth/react";
import { Icon } from "@rallly/ui/icon";
import { LogOutIcon } from "lucide-react";

export const SignOutButton = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        signOut();
      }}
    >
      <Icon>
        <LogOutIcon />
      </Icon>
      <Trans i18nKey="signOut" defaults="Sign Out" />
    </Button>
  );
};
