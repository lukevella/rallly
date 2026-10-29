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
import { useRouter } from "next/navigation";
import { DuplicateForm } from "@/features/poll/components/duplicate-form";
import { showOpenPollLimit } from "@/features/poll/limit/client";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const formName = "duplicate-form";
export function DuplicateDialog({
  pollId,
  pollTitle,
  ...props
}: DialogProps & { pollId: string; pollTitle: string }) {
  const duplicate = trpc.polls.duplicate.useMutation();
  const router = useRouter();
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
          onSubmit={(data) => {
            duplicate.mutate(
              { pollId, newTitle: data.title },
              {
                onSuccess: async (res) => {
                  if (res.ok) {
                    router.push(`/poll/${res.data.id}`);
                    return;
                  }
                  props.onOpenChange?.(false);
                  showOpenPollLimit("duplicate", res.error.usage);
                },
              },
            );
          }}
        />
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" />
          </DialogClose>
          <Button
            type="submit"
            loading={duplicate.isPending}
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
