import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller } from "react-hook-form";

import { useVotingForm } from "@/components/poll/voting-form";

import { usePoll } from "../../poll-context";
import UserAvatar, { YouAvatar } from "../user-avatar";
import { VoteSelector } from "../vote-selector";

export interface ParticipantRowFormProps {
  name?: string;
  className?: string;
  isYou?: boolean;
  onCancel?: () => void;
}

const ParticipantRowForm = ({
  name,
  isYou,
  className,
  onCancel,
}: ParticipantRowFormProps) => {
  const { t } = useTranslation();

  const { optionIds } = usePoll();
  const form = useVotingForm();

  React.useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    });
  }, [onCancel]);

  return (
    <tr className={cn(className)}>
      <td className="sticky left-0 z-10 bg-white pl-4 pr-4">
        <div className="flex items-center">
          {name ? (
            <UserAvatar name={name ?? t("you")} isYou={isYou} showName={true} />
          ) : (
            <YouAvatar />
          )}
        </div>
      </td>
      {optionIds.map((optionId, i) => {
        return (
          <td key={optionId} className="h-12 bg-white p-1">
            <Controller
              control={form.control}
              name={`votes.${i}`}
              render={({ field }) => (
                <VoteSelector
                  className="h-full w-full"
                  value={field.value.type}
                  onChange={(vote) => {
                    field.onChange({ optionId, type: vote });
                  }}
                />
              )}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default ParticipantRowForm;
