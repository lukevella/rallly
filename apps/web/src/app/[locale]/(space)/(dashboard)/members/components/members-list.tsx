"use client";

import { Badge } from "@rallly/ui/badge";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { DataList } from "@/components/data-list";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { SpaceRole } from "@/features/space/components/space-role";
import type {
  MemberContentSummary,
  MemberDTO,
} from "@/features/space/member/types";
import { Trans } from "@/i18n/client";
import { MemberDropdownMenu } from "./member-dropdown-menu";

type MemberRow = {
  member: MemberDTO;
  canUpdate: boolean;
  canDelete: boolean;
  inactive: boolean;
  isActor: boolean;
  contentSummary: MemberContentSummary;
};

const columnHelper = createColumnHelper<MemberRow>();

const columns = [
  columnHelper.accessor((row) => row.member.name, {
    id: "avatar",
    header: () => <Trans i18nKey="membersListAvatar" defaults="Avatar" />,
    cell: ({ row }) => (
      <OptimizedAvatarImage
        src={row.original.member.image}
        name={row.original.member.name}
        size="sm"
      />
    ),
  }),
  columnHelper.accessor((row) => row.member.name, {
    id: "name",
    header: () => <Trans i18nKey="membersListName" defaults="Name" />,
    meta: { className: "gap-2" },
    cell: ({ row }) => (
      <>
        <span className="truncate text-sm">{row.original.member.name}</span>
        {row.original.member.isOwner ? (
          <Badge size="sm" className="shrink-0">
            <Trans i18nKey="owner" defaults="Owner" />
          </Badge>
        ) : null}
        {row.original.inactive ? (
          <Badge size="sm" className="shrink-0">
            <Trans i18nKey="memberInactive" defaults="Inactive" />
          </Badge>
        ) : null}
      </>
    ),
  }),
  columnHelper.accessor((row) => row.member.email, {
    id: "email",
    header: () => <Trans i18nKey="membersListEmail" defaults="Email" />,
    meta: {
      className: "hidden justify-end text-muted-foreground text-sm md:flex",
    },
    cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.member.role, {
    id: "role",
    header: () => <Trans i18nKey="membersListRole" defaults="Role" />,
    meta: {
      className: "hidden justify-end text-muted-foreground text-sm sm:flex",
    },
    cell: ({ getValue }) => (
      <Badge variant={getValue() === "admin" ? "secondary" : "default"}>
        <SpaceRole role={getValue()} />
      </Badge>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <Trans i18nKey="membersListActions" defaults="Actions" />,
    cell: ({ row, table }) => (
      <MemberDropdownMenu
        member={row.original.member}
        canUpdate={row.original.canUpdate}
        canDelete={row.original.canDelete}
        contentSummary={row.original.contentSummary}
        // Anyone still active here can take the leaver's content over.
        recipients={table.options.data
          .filter(
            (other) =>
              other.member.id !== row.original.member.id && !other.inactive,
          )
          .map((other) => ({
            id: other.member.id,
            name: other.member.name,
            image: other.member.image,
            isActor: other.isActor,
          }))}
      />
    ),
  }),
];

function matchesQuery(row: MemberRow, query: string) {
  const needle = query.toLocaleLowerCase();
  return (
    row.member.name.toLocaleLowerCase().includes(needle) ||
    row.member.email.toLocaleLowerCase().includes(needle)
  );
}

export function MembersList({ rows }: { rows: MemberRow[] }) {
  const query = useSearchParams().get("q")?.trim() ?? "";
  const state = React.useMemo(() => ({ globalFilter: query }), [query]);

  // Filtered in the row model, not the data: the actions column reads every
  // member from table.options.data to offer content reassignment.
  const table = useReactTable({
    data: rows,
    columns,
    state,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) =>
      matchesQuery(row.original, filterValue),
    getRowId: (row) => row.member.id,
  });

  if (query && table.getRowModel().rows.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <SearchIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="membersSearchEmptyTitle"
            defaults="No members found"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="membersSearchEmptyDescription"
            defaults="No members match “{query}”."
            values={{ query }}
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <DataList
      table={table}
      className="grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:grid-cols-[auto_minmax(0,1fr)_minmax(0,auto)_auto_auto]"
    />
  );
}
