"use client";

import { Trans } from "@/components/trans";
import { Button } from "@rallly/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { makeAdmin } from "./actions";

export function MakeMeAdminButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      onClick={async () => {
        startTransition(async () => {
          await makeAdmin();
          router.replace("/control-panel");
        });
      }}
      loading={isPending}
      variant="primary"
    >
      <Trans i18nKey="adminSetupCta" defaults="Make me an admin" />
    </Button>
  );
}
