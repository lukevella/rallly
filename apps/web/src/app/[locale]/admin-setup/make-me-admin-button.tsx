"use client";

import { Trans } from "@/components/trans";
import { useSafeAction } from "@/features/safe-action/client";
import { Button } from "@rallly/ui/button";
import { makeMeAdminAction } from "./actions";

export function MakeMeAdminButton() {
  const makeMeAdmin = useSafeAction(makeMeAdminAction);
  return (
    <Button
      onClick={async () => {
        await makeMeAdmin.executeAsync();
      }}
      loading={makeMeAdmin.isExecuting}
      variant="primary"
    >
      <Trans i18nKey="adminSetupCta" defaults="Make me an admin" />
    </Button>
  );
}
