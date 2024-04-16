"use client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CalendarCheckIcon } from "lucide-react";

import { trpc } from "@/app/providers";
import { FinalizePollForm } from "@/components/poll/manage-poll/finalize-poll-dialog";
import { Trans } from "@/components/trans";

export function FinalizeDialog({ pollId }: { pollId: string }) {
  const finalize = trpc.polls.book.useMutation();
  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button>
              <Icon>
                <CalendarCheckIcon />
              </Icon>
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent className="flex gap-x-2.5">
          <Trans i18nKey="finalize" />
        </TooltipContent>
      </Tooltip>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="finalize" />
          </DialogTitle>
          <DialogDescription>
            <Trans i18nKey="finalizeDescription" />
          </DialogDescription>
        </DialogHeader>
        <FinalizePollForm
          onSubmit={(data) => {
            finalize.mutate({
              pollId,
              optionId: data.selectedOptionId,
              notify: data.notify,
            });
          }}
          name="finalize"
        />
        <DialogFooter>
          <Button
            loading={finalize.isLoading}
            variant="primary"
            form="finalize"
            type="submit"
          >
            <Trans i18nKey="submit" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
