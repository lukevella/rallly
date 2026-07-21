"use client";

import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/features/space/member/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export const AcceptInviteButton = ({ spaceId }: { spaceId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const acceptInvite = useSafeAction(acceptInviteAction);

  // The result is handled from the promise rather than the hook's
  // onSuccess: accepting deletes the invite, so the action response
  // re-renders this route as a 404 and unmounts the button before
  // effect-driven callbacks get a chance to run.
  const handleClick = async () => {
    const result = await acceptInvite.executeAsync({ spaceId });
    const data = result?.data;

    if (data?.ok) {
      toast.success(
        t("acceptInviteSuccess", {
          defaultValue: "Successfully joined the space!",
        }),
      );
      router.push("/");
      return;
    }

    switch (data?.reason) {
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
  };

  return (
    <Button
      variant="primary"
      onClick={handleClick}
      loading={acceptInvite.isExecuting}
    >
      <Trans i18nKey="acceptInvite" defaults="Accept Invite" />
    </Button>
  );
};
