"use client";

import { Button } from "@rallly/ui/button";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Trans } from "@/components/trans";

export function LogoutButton() {
  return (
    <Button
      onClick={async () => {
        await signOut();
      }}
      variant="default"
    >
      <LogOutIcon className="size-4" />
      <Trans i18nKey="signOut" defaults="Sign Out" />
    </Button>
  );
}
