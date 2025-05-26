"use client";

import { Trans } from "@/components/trans";
import { Button } from "@rallly/ui/button";
import { useToast } from "@rallly/ui/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { makeAdmin } from "./actions";

export function MakeMeAdminButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      onClick={async () => {
        startTransition(async () => {
          const { success, error } = await makeAdmin();
          if (success) {
            router.replace("/control-panel");
          }

          if (error) {
            toast({
              title: "Error",
              description: error,
            });
          }
        });
      }}
      loading={isPending}
      variant="primary"
    >
      <Trans i18nKey="adminSetupCta" defaults="Make me an admin" />
    </Button>
  );
}
