"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/features/space/member/actions";
import { Trans, useTranslation } from "@/i18n/client";

export const AcceptInviteButton = ({ spaceId }: { spaceId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  // Accepting deletes the invite, so the action response re-renders this
  // route as a 404 and unmounts the button. Hook-level callbacks still run.
  const acceptInvite = useMutation(
    mutationOptions(acceptInviteAction, {
      onSuccess: (data) => {
        if (data.ok) {
          toast.success(
            t("acceptInviteSuccess", {
              defaultValue: "Successfully joined the space!",
            }),
          );
          router.push("/");
          return;
        }

        switch (data.reason) {
          case "INVITE_NOT_FOUND":
            toast.error(
              t("acceptInviteNotFound", {
                defaultValue: "This invite is no longer valid",
              }),
            );
            break;
          case "NOT_ENOUGH_SEATS":
            toast.error(
              t("acceptInviteNotEnoughSeats", {
                defaultValue:
                  "There are not enough seats available to join this space",
              }),
            );
            break;
        }
      },
    }),
  );

  return (
    <Button
      variant="primary"
      onClick={() => acceptInvite.mutate({ spaceId })}
      loading={acceptInvite.isPending}
    >
      <Trans i18nKey="acceptInvite" defaults="Accept invite" />
    </Button>
  );
};
