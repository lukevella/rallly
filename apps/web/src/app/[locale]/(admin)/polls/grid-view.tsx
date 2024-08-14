"use client";
import { PollStatus } from "@rallly/database";
import { Icon } from "@rallly/ui/icon";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CheckIcon, LinkIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { PollStatusBadge } from "@/components/poll-status";
import { Trans } from "@/components/trans";

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  if (didCopy) {
    return (
      <div className="inline-flex items-center gap-x-1.5 text-sm font-medium text-green-600">
        <CheckIcon className="size-4" />
        <Trans i18nKey="copied" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        copy(`${window.location.origin}/invite/${pollId}`);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
      className="text-foreground inline-flex items-center gap-x-1.5 text-sm hover:underline"
    >
      <LinkIcon className="size-4" />

      <Trans i18nKey="copyLink" defaults="Copy Link" />
    </button>
  );
}

function ParticipantCount({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-x-1 text-sm font-medium">
      <Icon>
        <UserIcon />
      </Icon>
      <span>{count}</span>
    </div>
  );
}

export function ListView({
  data,
  empty,
}: {
  empty?: React.ReactNode;
  data: {
    id: string;
    status: PollStatus;
    title: string;
    createdAt: Date;
    userId: string;
    participants: {
      id: string;
      name: string;
    }[];
  }[];
}) {
  const table = useReactTable({
    columns: [],
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data?.length === 0) {
    return <>{empty}</>;
  }

  return (
    <ul className="space-y-4">
      {table.getRowModel().rows.map((row) => (
        <li className="flex items-center gap-4" key={row.id}>
          <GroupPollIcon size="sm" />
          <PollStatusBadge status={row.original.status} />
          <h2 className="truncate text-base font-medium">
            <Link href={`/poll/${row.original.id}`} className="hover:underline">
              {row.original.title}
            </Link>
          </h2>
          <ParticipantCount count={row.original.participants.length} />

          <CopyLinkButton pollId={row.original.id} />
          <time
            dateTime={row.original.createdAt.toDateString()}
            className="text-muted-foreground whitespace-nowrap text-sm"
          >
            <Trans
              i18nKey="createdTime"
              values={{
                relativeTime: dayjs(row.original.createdAt).fromNow(),
              }}
            />
          </time>
        </li>
      ))}
    </ul>
  );
}
