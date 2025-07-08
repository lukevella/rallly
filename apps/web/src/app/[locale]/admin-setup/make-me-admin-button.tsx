"use client";

import { Trans } from "@/components/trans";
import { useSafeAction } from "@/features/safe-action/client";
import { Button } from "@rallly/ui/button";
import { useRouter } from "next/navigation";
import { makeMeAdminAction } from "./actions";

export function MakeMeAdminButton() {
  const router = useRouter();
  const makeMeAdmin = useSafeAction(makeMeAdminAction, {
    onSuccess: () => {
      router.replace("/control-panel");
    },
  });
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
