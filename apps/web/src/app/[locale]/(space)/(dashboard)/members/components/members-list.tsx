"use client";

import { Badge } from "@rallly/ui/badge";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataList } from "@/components/data-list";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { SpaceRole } from "@/features/space/components/space-role";
import type { MemberDTO } from "@/features/space/member/types";
import { Trans } from "@/i18n/client";
import { MemberDropdownMenu } from "./member-dropdown-menu";

type MemberRow = {
  member: MemberDTO;
  canUpdate: boolean;
  canDelete: boolean;
  inactive: boolean;
  isActor: boolean;
  // What the member still has running here; removal hands it over.
  openPollCount: number;
  liveEventCount: number;
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
        openPollCount={row.original.openPollCount}
        liveEventCount={row.original.liveEventCount}
        // Anyone still active here can take the leaver's content over.
        recipients={table.options.data
          .filter(
            (other) =>
              other.member.id !== row.original.member.id && !other.inactive,
          )
          .map((other) => ({
            id: other.member.id,
            name: other.member.name,
            isActor: other.isActor,
          }))}
      />
    ),
  }),
];

export function MembersList({ rows }: { rows: MemberRow[] }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.member.id,
  });

  return (
    <DataList
      table={table}
      className="grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:grid-cols-[auto_minmax(0,1fr)_minmax(0,auto)_auto_auto]"
    />
  );
}
