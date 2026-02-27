"use client";

import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export const AcceptInviteButton = ({ spaceId }: { spaceId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const acceptInvite = trpc.spaces.acceptInvite.useMutation({
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
        acceptInvite.mutate({ spaceId });
      }}
      loading={acceptInvite.isPending}
    >
      <Trans i18nKey="acceptInvite" defaults="Accept Invite" />
    </Button>
  );
};
