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
    <tr className={cn("group", className)}>
      <td
        style={{ minWidth: 240, maxWidth: 240 }}
        className="sticky left-0 z-10 bg-white px-4"
      >
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
          <td
            key={optionId}
            className="relative h-12 border-b border-l bg-white group-[.last-row]:border-b-0"
          >
            <Controller
              control={form.control}
              name={`votes.${i}`}
              render={({ field }) => (
                <div className="flex items-center justify-center">
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
      <td className="border-l" />
    </tr>
  );
};

export default ParticipantRowForm;
