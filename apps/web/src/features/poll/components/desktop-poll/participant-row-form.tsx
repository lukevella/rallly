import { cn } from "@rallly/ui";
import { Controller } from "react-hook-form";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  Participant,
  ParticipantName,
} from "@/features/poll/components/participant";
import { useOptions, usePoll } from "@/features/poll/components/poll-context";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { YouAvatar } from "@/features/poll/components/you-avatar";
import { useTranslation } from "@/i18n/client";
import { VoteTile } from "./vote-tile";

export interface ParticipantRowFormProps {
  name?: string;
  className?: string;
  image?: string;
  isYou?: boolean;
}

/**
 * The participant's row while their response is being edited: their name and
 * the answers picked so far. The header is the control and the footer holds
 * the actions.
 */
const ParticipantRowForm = ({
  name,
  image,
  className,
}: ParticipantRowFormProps) => {
  const { t } = useTranslation();

  const { optionIds } = usePoll();
  const { options } = useOptions();
  const form = useVotingForm();

  const participantName = name ?? t("you", { defaultValue: "You" });

  return (
    <tr className={cn("group", className)}>
      <td
        style={{ minWidth: 235, maxWidth: 235 }}
        className="sticky left-0 z-10 h-12 border-b border-b-border-muted bg-card px-3 group-[.last-row]:border-b-0"
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
        </div>
      </td>
      {optionIds.map((optionId, i) => {
        return (
          <td
            key={optionId}
            data-col={i}
            className="relative h-12 border-b border-b-border-muted bg-card group-[.last-row]:border-b-0"
          >
            {/* The header above is the control; this shows what was
                picked, in the same tile as the rows below. */}
            <Controller
              control={form.control}
              name={`votes.${i}`}
              render={({ field }) => (
                <VoteTile vote={field.value?.type} option={options[i]} />
              )}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default ParticipantRowForm;
