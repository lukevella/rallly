"use client";

import { Trans } from "@/components/trans";
import { useSafeAction } from "@/features/safe-action/client";
import { changeRoleAction } from "@/features/user/actions";
import { Button } from "@rallly/ui/button";
import { useRouter } from "next/navigation";

export function MakeMeAdminButton() {
  const router = useRouter();
  const changeRole = useSafeAction(changeRoleAction, {
    onSuccess: () => {
      router.replace("/control-panel");
    },
  });
  return (
    <Button
      onClick={async () => {
        await changeRole.executeAsync({
          role: "admin",
        });
      }}
      loading={changeRole.isExecuting}
      variant="primary"
    >
      <Trans i18nKey="adminSetupCta" defaults="Make me an admin" />
    </Button>
  );
}
