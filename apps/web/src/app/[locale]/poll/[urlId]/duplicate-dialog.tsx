"use client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogProps,
  DialogTitle,
} from "@rallly/ui/dialog";
import { useRouter } from "next/navigation";

import { DuplicateForm } from "@/app/[locale]/poll/[urlId]/duplicate-form";
import { PayWallDialogContent } from "@/app/[locale]/poll/[urlId]/pay-wall-dialog-content";
import { trpc } from "@/app/providers";
import { Trans } from "@/components/trans";
import { usePostHog } from "@/utils/posthog";

const formName = "duplicate-form";
export function DuplicateDialog({
  pollId,
  pollTitle,
  ...props
}: DialogProps & { pollId: string; pollTitle: string }) {
  const queryClient = trpc.useUtils();
  const duplicate = trpc.polls.duplicate.useMutation();
  const posthog = usePostHog();
  const router = useRouter();
  return (
    <Dialog {...props}>
      <PayWallDialogContent>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="duplicate" />
            </DialogTitle>
            <DialogDescription>
              <Trans i18nKey="duplicateDescription" />
            </DialogDescription>
          </DialogHeader>
          <DuplicateForm
            name={formName}
            defaultValues={{
              title: pollTitle,
            }}
            onSubmit={(data) => {
              duplicate.mutate(
                { pollId, newTitle: data.title },
                {
                  onSuccess: async (res) => {
                    posthog?.capture("duplicate poll", {
                      pollId,
                      newPollId: res.id,
                    });
                    queryClient.invalidate();
                    router.push(`/poll/${res.id}`);
                  },
                },
              );
            }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="cancel" />
              </Button>
            </DialogClose>
            <Button
              type="submit"
              loading={duplicate.isLoading}
              variant="primary"
              form={formName}
            >
              <Trans i18nKey="duplicate" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </PayWallDialogContent>
    </Dialog>
  );
}
