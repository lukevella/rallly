"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { setParticipantsRevealedAction } from "@/features/poll/actions";
import { usePoll } from "@/features/poll/client";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Only relevant when hideParticipants is on: the host decides when other
 * participants learn who cast which vote. Vote tallies are always visible;
 * this only controls identities.
 */
export function RevealParticipantsToggle() {
  const poll = usePoll();
  const { ownsObject } = useUser();
  const { t } = useTranslation();
  // The action refreshes the page, which is what flips
  // `poll.participantsRevealed` in the layout's server props.
  const setParticipantsRevealed = useMutation(
    mutationOptions(setParticipantsRevealedAction, {
      onSuccess: (data, input) => {
        if (!data.ok) {
          return;
        }
        toast(
          input.participantsRevealed
            ? t("revealParticipantsToast", {
                defaultValue: "Participant identities are now visible",
              })
            : t("hideParticipantsAgainToast", {
                defaultValue: "Participant identities are hidden again",
              }),
        );
      },
    }),
  );

  if (!ownsObject(poll) || !poll.hideParticipants) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={poll.participantsRevealed}
            aria-label={
              poll.participantsRevealed
                ? t("hideParticipantsAgain", {
                    defaultValue: "Hide identities again",
                  })
                : t("revealParticipants", {
                    defaultValue: "Reveal identities",
                  })
            }
            loading={setParticipantsRevealed.isPending}
            onClick={() => {
              setParticipantsRevealed.mutate({
                pollId: poll.id,
                participantsRevealed: !poll.participantsRevealed,
              });
            }}
          >
            {poll.participantsRevealed ? <EyeIcon /> : <EyeOffIcon />}
            <span className="sr-only">
              {poll.participantsRevealed
                ? t("hideParticipantsAgain", {
                    defaultValue: "Hide identities again",
                  })
                : t("revealParticipants", {
                    defaultValue: "Reveal identities",
                  })}
            </span>
          </Button>
        }
      />
      <TooltipContent>
        {poll.participantsRevealed ? (
          <Trans
            i18nKey="hideParticipantsAgain"
            defaults="Hide identities again"
          />
        ) : (
          <Trans i18nKey="revealParticipants" defaults="Reveal identities" />
        )}
      </TooltipContent>
    </Tooltip>
  );
}
