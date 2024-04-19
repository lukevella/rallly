"use client";
import { cn } from "@rallly/ui";
import { CalendarCheckIcon, PauseIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next";

import { Participants } from "@/app/components/participants";
import { Attendees } from "@/components/attendees";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { useParticipants } from "@/components/participants-provider";
import { VotingForm } from "@/components/poll/voting-form";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";

import { useTouchBeacon } from "./poll/use-touch-beacon";

export const Poll = () => {
  const poll = usePoll();
  useTouchBeacon(poll.id);

  const { participants } = useParticipants();
  const { canAddNewParticipant, canEditParticipant } = usePermissions();
  const participant = participants.find((participant) =>
    canEditParticipant(participant.id),
  );

  const userAlreadyVoted = !!participant;

  return (
    <div className={cn("space-y-3 sm:space-y-6")}>
      {poll.event ? (
        <div className="flex flex-col gap-x-4 gap-y-1.5 rounded-lg bg-green-600 px-4 py-3 text-sm text-green-50 lg:flex-row">
          <div className="flex items-center gap-x-2.5">
            <CalendarCheckIcon className="size-4 text-green-100" />
            <div className="font-medium">
              <Trans i18nKey="pollStatusFinalized" />
            </div>
          </div>
          <div className="text-green-50">
            <Trans i18nKey="pollStatusFinalizedDescription" />
          </div>
        </div>
      ) : null}
      {poll.status === "paused" ? (
        <div className="flex flex-col gap-x-4 gap-y-1.5 rounded-lg bg-gray-200 px-4 py-3 text-sm text-gray-600 lg:flex-row">
          <div className="flex items-center gap-x-2.5">
            <PauseIcon className="size-4" />
            <div className="font-medium ">
              <Trans i18nKey="pollStatusPaused" />
            </div>
          </div>
          <div className="">
            <Trans
              i18nKey="pollStatusPausedDescription"
              defaults="Votes cannot be submitted or edited."
            />
          </div>
        </div>
      ) : null}
      <EventCard />

      {!poll.event ? (
        <VotingForm
          defaultValues={{
            participantId: participant?.id,
            mode: canAddNewParticipant && !userAlreadyVoted ? "new" : "view",
          }}
        >
          <Participants />
        </VotingForm>
      ) : (
        <Attendees optionId={poll.event.optionId} />
      )}

      <Discussion />

      <div className="mt-4 space-y-4 text-center text-sm text-gray-500">
        <div className="pb-8">
          <Trans
            defaults="Powered by <a>{name}</a>"
            i18nKey="poweredByRallly"
            values={{ name: "rallly.co" }}
            components={{
              a: (
                <Link
                  prefetch={false}
                  className="hover:text-primary-600 rounded-none border-b border-b-gray-500 font-semibold"
                  href={`https://rallly.co?utm_source=poll&utm_medium=referral&utm_campaign=poll_referral_${poll.id}`}
                />
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
};
