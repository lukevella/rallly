import { cn } from "@rallly/ui";
import { useTranslation } from "next-i18next";
import * as React from "react";

import { usePoll } from "../../poll-context";
import { ParticipantFormSubmitted } from "../types";
import UserAvatar, { YouAvatar } from "../user-avatar";
import { VoteSelector } from "../vote-selector";

export interface ParticipantRowFormProps {
  name?: string;
  onSubmit: (data: ParticipantFormSubmitted) => Promise<void>;
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

  React.useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    });
  }, [onCancel]);

  return (
    <tr className={cn(className)}>
      <td className="sticky left-0 z-10 bg-white/90 pl-4 pr-4 backdrop-blur-sm">
        {name ? (
          <UserAvatar name={name ?? t("you")} isYou={isYou} showName={true} />
        ) : (
          <YouAvatar />
        )}
      </td>

      {optionIds.map((optionId) => {
        return (
          <td key={optionId} className="h-12 bg-white p-1">
            <VoteSelector
              className="h-full w-full"
              // value={value?.type}

              // onChange={(vote) => {
              //   const newValue = [...field.value];
              //   newValue[index] = { optionId, type: vote };
              //   field.onChange(newValue);
              // }}
              // ref={(el) => {
              //   checkboxRefs.current[index] = el;
              // }}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default ParticipantRowForm;
