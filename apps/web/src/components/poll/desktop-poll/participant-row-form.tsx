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
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller } from "react-hook-form";

import { useVotingForm } from "@/components/poll/voting-form";
import { Trans } from "@/components/trans";

import { usePoll } from "../../poll-context";
import UserAvatar, { YouAvatar } from "../user-avatar";
import { toggleVote, VoteSelector } from "../vote-selector";

export interface ParticipantRowFormProps {
  name?: string;
  className?: string;
  isYou?: boolean;
  isNew?: boolean;
  onCancel?: () => void;
}

const ParticipantRowForm = ({
  name,
  isNew,
  isYou,
  className,
}: ParticipantRowFormProps) => {
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

  return (
    <tr className={cn("group", className)}>
      <td
        style={{ minWidth: 240, maxWidth: 240 }}
        className="sticky left-0 z-10 h-12 bg-white px-4"
      >
        <div className="flex items-center justify-between gap-x-2.5">
          {name ? (
            <UserAvatar name={name ?? t("you")} isYou={isYou} showName={true} />
          ) : (
            <YouAvatar />
          )}
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
      </td>
      {optionIds.map((optionId, i) => {
        return (
          <td
            key={optionId}
            className="relative h-12 border-l border-t bg-gray-50"
          >
            <Controller
              control={form.control}
              name={`votes.${i}`}
              render={({ field }) => (
                <div
                  onClick={() => {
                    field.onChange({
                      optionId,
                      type: toggleVote(field.value.type),
                    });
                  }}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center hover:bg-gray-100 active:bg-gray-200/50 active:ring-1 active:ring-inset active:ring-gray-200"
                >
                  <VoteSelector
                    value={field.value.type}
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
      <td className="bg-diagonal-lines border-l" />
    </tr>
  );
};

export default ParticipantRowForm;
