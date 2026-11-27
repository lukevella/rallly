"use client";

import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  LinkIcon,
  MailIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "lucide-react";
import type React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  CopyEditLinkMenuItem,
  DeleteParticipantModal,
} from "@/features/poll/components/participant-dropdown";
import { Trans, useTranslation } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { ChatBubble } from "./chat-bubble";
import { PollSection } from "./poll-section";

type Participant = {
  id: string;
  name: string;
  image: string | null;
  note: string | null;
  respondedAt: Date;
  viaInvite: boolean;
  editUrl: string;
};

/** The participants card: everyone who responded, or an empty state. */
export function PollParticipantsSection({
  title,
  participants,
  empty,
}: {
  title: React.ReactNode;
  participants: Participant[];
  empty: React.ReactNode;
}) {
  return (
    <PollSection
      id="poll-participants"
      title={title}
      count={participants.length}
      flush={participants.length > 0}
    >
      {participants.length > 0 ? (
        <PollParticipants participants={participants} />
      ) : (
        empty
      )}
    </PollSection>
  );
}

/**
 * Everyone who responded, newest first, with the notes they left. Rows share
 * the list's columns, so names, sources, times and menus line up.
 */
export function PollParticipants({
  participants,
}: {
  participants: Participant[];
}) {
  return (
    <ul className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 text-sm">
      {participants.map((participant) => (
        <li
          key={participant.id}
          className="col-span-full grid grid-cols-subgrid items-center gap-y-2 border-button-outline border-b px-5 py-4 last:border-b-0"
        >
          <OptimizedAvatarImage
            size="sm"
            name={participant.name}
            src={participant.image ?? undefined}
          />
          <span className="min-w-0 truncate">{participant.name}</span>
          <SourceIcon source={participant.viaInvite ? "email" : "link"} />
          <span className="whitespace-nowrap text-muted-foreground">
            <RelativeTime value={participant.respondedAt} />
          </span>
          <ParticipantMenu participant={participant} />
          {participant.note ? (
            <div className="col-start-2 col-end-[-1]">
              <ChatBubble tone="primary">{participant.note}</ChatBubble>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ParticipantMenu({ participant }: { participant: Participant }) {
  const { t } = useTranslation();
  const deleteDialog = useDialog();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("participantMenu", {
                defaultValue: "Options for {name}",
                name: participant.name,
              })}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <CopyEditLinkMenuItem
            editUrl={participant.editUrl}
            participantName={participant.name}
          />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteDialog.trigger()}
          >
            <TrashIcon />
            <Trans i18nKey="delete" defaults="Delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteParticipantModal
        {...deleteDialog.dialogProps}
        participantId={participant.id}
        participantName={participant.name}
      />
    </>
  );
}

function SourceIcon({ source }: { source: "email" | "link" }) {
  const label =
    source === "email" ? (
      <Trans i18nKey="overviewViaInvite" defaults="Email invite" />
    ) : (
      <Trans i18nKey="overviewViaLink" defaults="Shared link" />
    );
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className="inline-flex shrink-0 text-muted-foreground [&_svg]:size-4"
      >
        {source === "email" ? (
          <MailIcon aria-hidden="true" />
        ) : (
          <LinkIcon aria-hidden="true" />
        )}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
