"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { MapPinIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { finalizeLocationPollAction } from "@/features/poll/actions";
import { useParticipants, usePoll } from "@/features/poll/client";
import { VoteSummaryProgressBar } from "@/features/poll/components/vote-summary-progress-bar";
import { rankOptionsByPopularity } from "@/features/poll/utils";
import { Trans } from "@/i18n/client";

/**
 * Picks the winning place of a location poll. There is no event to schedule
 * and nobody to invite to a time, so finalizing is one choice and one click:
 * the place becomes the poll's location and the poll closes.
 */
export function FinalizeLocationDialog(props: DialogProps) {
  const poll = usePoll();
  const { participants } = useParticipants();
  const router = useRouter();

  const ranked = React.useMemo(
    () => rankOptionsByPopularity({ options: poll.options, participants }),
    [poll.options, participants],
  );
  const [optionId, setOptionId] = React.useState<string | null>(null);

  const finalize = useMutation(
    mutationOptions(finalizeLocationPollAction, {
      onSuccess: (data) => {
        if (!data.ok) {
          toast.error(
            <Trans
              i18nKey="finalizePollError"
              defaults="Failed to finalize poll"
            />,
          );
          return;
        }
        props.onOpenChange?.(false);
        // The page behind the dialog picks up the closed status.
        router.refresh();
      },
      onError: () => {
        toast.error(
          <Trans
            i18nKey="finalizePollError"
            defaults="Failed to finalize poll"
          />,
        );
      },
    }),
  );

  return (
    <Dialog
      {...props}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setOptionId(null);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-4rem)] sm:w-[28rem]">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="finalizePoll" defaults="Finalize poll" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="finalizeLocationPollDescription"
              defaults="Pick the place that works best."
            />
          </DialogDescription>
        </DialogHeader>
        <fieldset className="max-h-96 space-y-2 overflow-y-auto">
          <legend className="sr-only">
            <Trans i18nKey="places" defaults="Places" />
          </legend>
          {ranked.map((option, index) => (
            <label
              key={option.id}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors hover:bg-accent has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring",
              )}
            >
              <input
                type="radio"
                name="finalize-place"
                value={option.id}
                data-testid="finalize-place"
                checked={option.id === optionId}
                onChange={() => setOptionId(option.id)}
                className="sr-only"
              />
              <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {option.name}
                </span>
                {option.address ? (
                  <span className="block truncate text-muted-foreground text-xs">
                    {option.address}
                  </span>
                ) : null}
              </span>
              {index === 0 && option.votes.yes.length > 0 ? (
                <span className="shrink-0 font-medium text-primary text-xs">
                  <Trans i18nKey="finalizeTopChoice" defaults="Top choice" />
                </span>
              ) : null}
              <span className="hidden w-24 shrink-0 sm:flex">
                <VoteSummaryProgressBar
                  {...option.votes}
                  total={participants.length}
                  showTentative={poll.allowTentativeVotes}
                />
              </span>
            </label>
          ))}
        </fieldset>
        <DialogFooter>
          <Button onClick={() => props.onOpenChange?.(false)}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Button>
          <Button
            variant="primary"
            disabled={!optionId}
            loading={finalize.isPending}
            onClick={() => {
              if (optionId) {
                finalize.mutate({ pollId: poll.id, optionId });
              }
            }}
          >
            <Trans i18nKey="finalize" defaults="Finalize" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
