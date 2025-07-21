"use client";

import { Button } from "@rallly/ui/button";
import { Trans } from "@/components/trans";
import { useSafeAction } from "@/lib/safe-action/client";
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
