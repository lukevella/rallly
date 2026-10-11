"use client";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import { useProMonthlyPrice, useTrialState } from "@/features/billing/client";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { startTrial } from "@/features/billing/trial/actions";
import { TrialTerms } from "@/features/billing/trial/components/trial-terms";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { trpc } from "@/trpc/client";
import { DuplicateForm } from "./duplicate-form";

const formName = "duplicate-form";
export function DuplicateDialog({
  pollId,
  pollTitle,
  ...props
}: DialogProps & { pollId: string; pollTitle: string }) {
  const duplicate = trpc.polls.duplicate.useMutation();
  const router = useRouter();
  const trialState = useTrialState();
  const price = useProMonthlyPrice();
  const { t } = useTranslation();
  const { formatDateTime } = useDateTime();
  // Duplicating is paid. Before a trial the press starts the 14 free days
  // and then duplicates; after the trial the primary button goes to checkout.
  const start = useSafeAction(startTrial, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success(
          t("trialStartedToast", {
            defaultValue:
              "Your 14 free days of Pro started, free until {date}.",
            date: formatDateTime(data.endsAt, "monthDay"),
          }),
        );
      }
    },
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="duplicate" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="duplicateDescription"
              defaults="Create a new poll based on this one"
            />
          </DialogDescription>
        </DialogHeader>
        <DuplicateForm
          name={formName}
          defaultValues={{
            title: pollTitle,
          }}
          onSubmit={async (data) => {
            if (trialState === "eligible") {
              const result = await start.executeAsync();
              if (!result?.data) {
                // Refused; the action's toast said why.
                return;
              }
            }
            duplicate.mutate(
              { pollId, newTitle: data.title },
              {
                onSuccess: async (res) => {
                  router.push(`/poll/${res.id}`);
                },
              },
            );
          }}
        />
        <TrialTerms action="duplicate" />
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" />
          </DialogClose>
          {trialState === "ended" ? (
            <UpgradeButton size="default">
              <Trans
                i18nKey="upgradeToProPrice"
                defaults="Upgrade to Pro, {price} a month"
                values={{ price }}
              />
            </UpgradeButton>
          ) : (
            <Button
              type="submit"
              loading={duplicate.isPending || start.isExecuting}
              variant="primary"
              form={formName}
            >
              {trialState === "eligible" ? (
                <Trans
                  i18nKey="duplicateAndStartTrial"
                  defaults="Duplicate and start 14 free days"
                />
              ) : (
                <Trans i18nKey="duplicate" />
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
