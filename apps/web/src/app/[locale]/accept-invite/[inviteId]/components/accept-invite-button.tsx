"use client";

import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { Trans } from "@/components/trans";
import { acceptInviteAction } from "@/features/spaces/actions";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export const AcceptInviteButton = ({ spaceId }: { spaceId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const acceptInvite = useSafeAction(acceptInviteAction, {
    onSuccess: () => {
      toast.success(
        t("acceptInviteSuccess", {
          defaultValue: "Successfully joined the space!",
        }),
      );
      router.push("/");
    },
  });
  return (
    <Button
      variant="primary"
      onClick={() => {
        acceptInvite.execute({ spaceId });
      }}
      loading={acceptInvite.isExecuting}
    >
      <Trans i18nKey="acceptInvite" defaults="Accept Invite" />
    </Button>
  );
};
