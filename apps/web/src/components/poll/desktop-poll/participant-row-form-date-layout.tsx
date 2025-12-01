"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { UndoIcon } from "lucide-react";
import * as React from "react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Participant, ParticipantName } from "@/components/participant";
import { useVotingForm } from "@/components/poll/voting-form";
import { YouAvatar } from "@/components/poll/you-avatar";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

import type { DateGroup } from "../group-by-date";
import { DateRow } from "./date-row";

export interface ParticipantRowFormDateLayoutProps {
  name?: string;
  className?: string;
  isNew?: boolean;
  dateGroups: DateGroup[];
}

export function ParticipantRowFormDateLayout({
  name,
  isNew,
  dateGroups,
  className,
}: ParticipantRowFormDateLayoutProps) {
  const { t } = useTranslation();
  const { optionIds } = usePoll();
  const form = useVotingForm();

  React.useEffect(() => {
    function cancel(e: KeyboardEvent) {
      if (e.key === "Escape") {
        form.cancel();
      }
    }
    window.addEventListener("keydown", cancel);
    return () => {
      window.removeEventListener("keydown", cancel);
    };
  }, [form]);

  const participantName = name ?? t("you");
  const votes = form.watch("votes");

  const voteMap = React.useMemo(() => {
    const map = new Map<string, VoteType>();
    votes?.forEach((vote) => {
      if (vote?.optionId && vote?.type) {
        map.set(vote.optionId, vote.type);
      }
    });
    return map;
  }, [votes]);

  const handleVoteChange = (optionId: string, type: VoteType) => {
    const voteIndex = optionIds.findIndex((id) => id === optionId);
    if (voteIndex !== -1) {
      form.setValue(`votes.${voteIndex}`, { optionId, type });
    }
  };

  return (
    <div className={cn("space-y-4 border-b bg-gray-50 p-4", className)}>
      <div className="flex items-center justify-between">
        <Participant>
          {name ? (
            <OptimizedAvatarImage name={participantName} size="sm" />
          ) : (
            <YouAvatar />
          )}
          <ParticipantName>{participantName}</ParticipantName>
        </Participant>
        {!isNew ? (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => {
                    form.cancel();
                  }}
                  size="sm"
                >
                  <Icon>
                    <UndoIcon />
                  </Icon>
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>
                  <Trans i18nKey="cancel" />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
            <Button
              variant="primary"
              loading={form.formState.isSubmitting}
              size="sm"
              form="voting-form"
              type="submit"
            >
              <Trans i18nKey="save" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-0">
        {dateGroups.map((dateGroup) => (
          <DateRow
            key={dateGroup.date}
            dateGroup={dateGroup}
            votes={voteMap}
            onVoteChange={handleVoteChange}
            editable={true}
          />
        ))}
      </div>
    </div>
  );
}
