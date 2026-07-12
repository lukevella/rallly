import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { UndoIcon } from "lucide-react";
import * as React from "react";
import { Controller } from "react-hook-form";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Participant, ParticipantName } from "@/components/participant";
import { useVotingForm } from "@/components/poll/voting-form";
import { YouAvatar } from "@/components/poll/you-avatar";
import { Trans, useTranslation } from "@/i18n/client";
import { getOptionDateTimeLabel } from "@/lib/utils/date-time-utils";

import { useOptions, usePoll } from "../../poll-context";
import { VoteSelector } from "../vote-selector";

export interface ParticipantRowFormProps {
  name?: string;
  className?: string;
  image?: string;
  isYou?: boolean;
  isNew?: boolean;
  onCancel?: () => void;
}

const ParticipantRowForm = ({
  name,
  image,
  isNew,
  className,
}: ParticipantRowFormProps) => {
  const { t } = useTranslation();

  const { optionIds } = usePoll();
  const { options } = useOptions();
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

  return (
    <tr className={cn("group", className)}>
      <td
        style={{ minWidth: 235, maxWidth: 235 }}
        className="sticky left-0 z-10 h-12 border-b border-b-border-muted bg-background px-3 group-[.last-row]:border-b-0"
      >
        <div className="flex items-center justify-between gap-x-2.5">
          <Participant>
            {name ? (
              <OptimizedAvatarImage
                name={participantName}
                size="sm"
                src={image ?? undefined}
              />
            ) : (
              <YouAvatar />
            )}
            <ParticipantName>{participantName}</ParticipantName>
          </Participant>
          {!isNew ? (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label={t("cancel", { defaultValue: "Cancel" })}
                      variant="ghost"
                      onClick={() => {
                        form.cancel();
                      }}
                      size="icon-sm"
                    >
                      <UndoIcon />
                    </Button>
                  }
                />
                <TooltipContent>
                  <Trans i18nKey="cancel" />
                </TooltipContent>
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
      </td>
      {optionIds.map((optionId, i) => {
        const option = options[i];
        return (
          <td
            key={optionId}
            className="relative h-12 border-b border-b-border-muted border-l bg-background group-[.last-row]:border-b-0"
          >
            <Controller
              control={form.control}
              name={`votes.${i}`}
              render={({ field }) => (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-colors",
                    "hover:bg-gray-50 active:bg-gray-100 active:ring-1 active:ring-gray-200 active:ring-inset dark:active:bg-gray-700/50 dark:active:ring-gray-700 dark:active:ring-inset dark:hover:bg-gray-800",
                  )}
                >
                  <VoteSelector
                    className="after:absolute after:inset-0"
                    optionLabel={
                      option ? getOptionDateTimeLabel(option) : undefined
                    }
                    value={field.value?.type}
                    onChange={(vote) => {
                      field.onChange({ optionId, type: vote });
                    }}
                  />
                </div>
              )}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default ParticipantRowForm;
