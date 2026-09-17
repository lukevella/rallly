"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { useParticipants } from "@/features/poll/client";
import VoteIcon from "@/features/poll/components/vote-icon";
import { filterParticipantsByVote } from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";

/** Who voted what on one option, yes first. */
export function PollOptionVoteSummary({ optionId }: { optionId: string }) {
  const { t } = useTranslation();
  const { participants } = useParticipants();
  const participantsWithVotes = (["yes", "ifNeedBe", "no"] as const).flatMap(
    (voteType) =>
      filterParticipantsByVote(participants, optionId, voteType).map(
        (participant) => ({ participant, voteType }),
      ),
  );

  if (participantsWithVotes.length === 0) {
    return (
      <p className="rounded-lg bg-muted p-2 text-center text-muted-foreground text-sm">
        {t("noVotes", {
          defaultValue: "No one has voted for this option",
        })}
      </p>
    );
  }

  return (
    <ul className="max-h-[min(20rem,40dvh)] space-y-2.5 overflow-y-auto">
      {participantsWithVotes.map(({ participant, voteType }) => (
        <li key={participant.id} className="flex items-center gap-x-2.5">
          <OptimizedAvatarImage
            size="sm"
            name={participant.name}
            src={participant.image ?? undefined}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1 truncate text-sm">
            {participant.name}
          </div>
          <VoteIcon type={voteType} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/** Dialog listing who voted on an option. Spread `useDialog().dialogProps`. */
export function VoteBreakdownDialog({
  optionId,
  optionLabel,
  ...dialogProps
}: React.ComponentProps<typeof Dialog> & {
  optionId: string;
  optionLabel: string;
}) {
  return (
    <Dialog {...dialogProps}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="participants" defaults="Participants" />
          </DialogTitle>
          <DialogDescription>{optionLabel}</DialogDescription>
        </DialogHeader>
        <PollOptionVoteSummary optionId={optionId} />
      </DialogContent>
    </Dialog>
  );
}
