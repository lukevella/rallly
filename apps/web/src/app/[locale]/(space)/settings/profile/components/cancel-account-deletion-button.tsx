"use client";
import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { Trans, useTranslation } from "@/i18n/client";
import { cancelAccountDeletionAction } from "../actions";

export function CancelAccountDeletionButton() {
  const { t } = useTranslation();
  const cancelAccountDeletion = useMutation(
    mutationOptions(cancelAccountDeletionAction, {
      onSuccess: () => {
        toast.success(
          t("accountDeletionCancelled", {
            defaultValue: "Your account is no longer scheduled for deletion",
          }),
        );
      },
    }),
  );

  return (
    <Button
      loading={cancelAccountDeletion.isPending}
      onClick={() => cancelAccountDeletion.mutate()}
    >
      <Trans i18nKey="cancelAccountDeletion" defaults="Cancel deletion" />
    </Button>
  );
}
