"use client";

import { cn } from "@rallly/ui";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { InboxIcon } from "lucide-react";
import React from "react";
import { DataList } from "@/components/data-list";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Link } from "@/components/link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PollResponseActions } from "@/features/poll/components/poll-response-actions";
import { Trans } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";

type ResponseRow = {
  id: string;
  name: string;
  note: string | null;
  image: string | null;
  createdAt: Date;
  editUrl: string;
};

const columnHelper = createColumnHelper<ResponseRow>();

/**
 * Responses as rows that open the response on the Responses page. `compact`
 * is the split view's list: the detail beside it carries the note and the
 * actions.
 */
export function PollResponsesList({
  pollId,
  participants,
  pollOpen,
  selectedId,
  compact = false,
  className,
}: {
  pollId: string;
  participants: ResponseRow[];
  pollOpen: boolean;
  selectedId?: string;
  compact?: boolean;
  className?: string;
}) {
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => <Trans i18nKey="name" defaults="Name" />,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <OptimizedAvatarImage
              size="sm"
              name={row.original.name}
              src={row.original.image ?? undefined}
            />
            <div className="min-w-0">
              <Link
                href={`/polls/${pollId}/responses?responseId=${row.original.id}`}
                aria-current={
                  row.original.id === selectedId ? "page" : undefined
                }
                scroll={false}
                className="block truncate text-sm outline-none after:absolute after:inset-0"
              >
                {row.original.name}
              </Link>
            </div>
          </div>
        ),
      }),
      ...(compact
        ? []
        : [
            columnHelper.accessor("note", {
              header: () => (
                <Trans i18nKey="pollResponsesListNote" defaults="Note" />
              ),
              meta: {
                className: "hidden text-muted-foreground text-sm sm:flex",
              },
              cell: ({ getValue }) => (
                <span className="truncate" title={getValue() ?? undefined}>
                  {getValue()}
                </span>
              ),
            }),
          ]),
      columnHelper.accessor("createdAt", {
        header: () => <Trans i18nKey="respondedOn" defaults="Responded on" />,
        meta: {
          className: "justify-end text-muted-foreground text-xs",
        },
        cell: ({ getValue }) => <RelativeTime value={getValue()} />,
      }),
      ...(compact
        ? []
        : [
            columnHelper.display({
              id: "actions",
              header: () => (
                <Trans i18nKey="pollResponsesListActions" defaults="Actions" />
              ),
              cell: ({ row }) => (
                <PollResponseActions
                  participantId={row.original.id}
                  participantName={row.original.name}
                  editUrl={row.original.editUrl}
                  pollOpen={pollOpen}
                />
              ),
            }),
          ]),
    ],
    [compact, pollId, pollOpen, selectedId],
  );

  const table = useReactTable({
    data: participants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (participant) => participant.id,
  });

  if (participants.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <InboxIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="pollResponsesListEmpty" defaults="No responses" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="pollResponsesListEmptyDescription"
            defaults="Responses will show up here once participants vote."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <DataList
      table={table}
      className={cn(
        compact
          ? "grid-cols-[minmax(0,1fr)_auto]"
          : "grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto]",
        className,
      )}
    />
  );
}
