"use client";
import { usePostHog } from "@rallly/posthog/client";
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
import { useRouter } from "next/navigation";

import { DuplicateForm } from "@/app/[locale]/poll/[urlId]/duplicate-form";
import { trpc } from "@/app/providers";
import { Trans } from "@/components/trans";

const formName = "duplicate-form";
export function DuplicateDialog({
  pollId,
  pollTitle,
  ...props
}: DialogProps & { pollId: string; pollTitle: string }) {
  const duplicate = trpc.polls.duplicate.useMutation();
  const posthog = usePostHog();
  const router = useRouter();
  return (
    <Dialog {...props}>
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
    </Dialog>
  );
}
