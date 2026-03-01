"use client";

import { Button } from "@rallly/ui/button";
import { useRouter } from "next/navigation";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function MakeMeAdminButton() {
  const router = useRouter();
  const makeMeAdmin = trpc.admin.makeMeAdmin.useMutation({
    onSuccess: () => {
      router.push("/control-panel");
    },
  });
  return (
    <Button
      onClick={async () => {
        await makeMeAdmin.mutateAsync();
      }}
      loading={makeMeAdmin.isPending}
      variant="primary"
    >
      <Trans i18nKey="adminSetupCta" defaults="Make me an admin" />
    </Button>
  );
}
