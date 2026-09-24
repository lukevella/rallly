"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Trans } from "@/i18n/client";
import { makeMeAdminAction } from "./actions";

export function MakeMeAdminButton() {
  const makeMeAdmin = useMutation(mutationOptions(makeMeAdminAction));
  return (
    <Button
      onClick={() => makeMeAdmin.mutate()}
      loading={makeMeAdmin.isPending}
      variant="primary"
    >
      <Trans i18nKey="adminSetupCta" defaults="Make me an admin" />
    </Button>
  );
}
