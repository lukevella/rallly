"use client";

import type { Poll } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Checkbox } from "@rallly/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rallly/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CalendarIcon,
  CheckIcon,
  LinkIcon,
  Loader2Icon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { PollStatusIcon } from "@/components/poll-status-icon";
import { Trans } from "@/components/trans";
import { VisibilityTrigger } from "@/components/visibility-trigger";

import { DeletePollsDialog } from "./delete-polls-dialog";

// Define a simplified poll type that matches what we're returning from the server
type SimplifiedPoll = {
  id: string;
  title: string;
  status: Poll["status"];
  createdAt: Date;
  participants: { id: string }[];
  options: { id: string }[];
  votes: { id: string }[];
};

const columnHelper = createColumnHelper<SimplifiedPoll>();

function PollActions({ poll }: { poll: SimplifiedPoll }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleCopyLink = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      copy(`${window.location.origin}/invite/${poll.id}`);
      setDidCopy(true);
      setTimeout(() => {
        setDidCopy(false);
      }, 1000);
    },
    [copy, poll.id],
  );

  const handleDelete = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogChange = React.useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
  }, []);

  return (
    <>
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 w-8 p-0"
              >
                {didCopy ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <LinkIcon className="size-4" />
                )}
                <span className="sr-only">
                  {didCopy ? "Copied" : "Copy invite link"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{didCopy ? "Copied!" : "Copy invite link"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <TrashIcon className="size-4" />
                <span className="sr-only">Delete poll</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete poll</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <DeletePollsDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        pollIds={[poll.id]}
        onSuccess={() => {}}
      />
    </>
  );
}

// API response type
type PollsResponse = {
  polls: SimplifiedPoll[];
  totalPolls: number;
  nextPage: number | null;
};

// Function to fetch polls from the API
async function fetchPolls({
  pageParam = 1,
  status,
}: {
  pageParam?: number;
  status?: string;
}) {
  const params = new URLSearchParams();
  params.set("page", pageParam.toString());
  if (status) {
    params.set("status", status);
  }

  const response = await fetch(`/api/polls?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch polls");
  }

  return response.json() as Promise<PollsResponse>;
}

type PollsTableProps = {
  initialPolls: SimplifiedPoll[];
  initialTotalPolls: number;
  initialHasNextPage: boolean;
};

export function PollsTable({
  initialPolls,
  initialTotalPolls,
  initialHasNextPage,
}: PollsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedPollIds, setSelectedPollIds] = React.useState<string[]>([]);
  const searchParams = useSearchParams();

  // Get status from URL if available
  const status = searchParams.get("status") || undefined;

  // Use React Query's useInfiniteQuery for data fetching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = useInfiniteQuery({
    queryKey: ["polls", status],
    queryFn: ({ pageParam }) => fetchPolls({ pageParam, status }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialData: {
      pages: [
        {
          polls: initialPolls,
          totalPolls: initialTotalPolls,
          nextPage: initialHasNextPage ? 2 : null,
        },
      ],
      pageParams: [1],
    },
  });

  // Flatten all polls from all pages
  const allPolls = data?.pages.flatMap((page) => page.polls) || [];
  const totalPolls = data?.pages[0]?.totalPolls || 0;

  const columns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: Row<SimplifiedPoll> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.accessor("title", {
        header: () => <Trans i18nKey="title" defaults="Title" />,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <PollStatusIcon status={info.row.original.status} />
            <Link
              href={`/poll/${info.row.original.id}`}
              className="font-medium hover:underline"
            >
              {info.getValue()}
            </Link>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.participants, {
        id: "participantCount",
        header: () => <Trans i18nKey="participants" defaults="Participants" />,
        cell: (info) => {
          const participants = info.getValue();
          return (
            <div className="flex items-center">
              <UserIcon className="mr-2 size-4" />
              <span>{participants.length}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.options, {
        id: "optionCount",
        header: () => <span>Options</span>,
        cell: (info) => {
          const options = info.getValue();
          return (
            <div className="flex items-center">
              <CalendarIcon className="mr-2 size-4" />
              <span>{options.length}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        id: "createdDate",
        header: () => <span>Created</span>,
        cell: (info) => {
          const date = new Date(info.getValue());
          return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(date);
        },
      }),
      columnHelper.display({
        id: "actionButtons",
        header: () => <span>Actions</span>,
        cell: (info) => <PollActions poll={info.row.original} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: allPolls,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDeleteSelected = () => {
    // Get selected row IDs
    const selectedIds = Object.keys(rowSelection).map(
      (index) => allPolls[parseInt(index)].id,
    );

    if (selectedIds.length > 0) {
      // Set the selected poll IDs and open the confirmation dialog
      setSelectedPollIds(selectedIds);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteSuccess = () => {
    // After successful deletion, clear selection
    setRowSelection({});
  };

  const selectedCount = Object.keys(rowSelection).length;

  if (queryStatus === "loading" && allPolls.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (queryStatus === "error") {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">Error loading polls</p>
      </div>
    );
  }

  if (allPolls.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          <Trans i18nKey="noPolls" defaults="You don't have any polls yet" />
        </p>
      </div>
    );
  }

  return (
    <div>
      {selectedCount > 0 && (
        <div className="bg-muted mb-4 flex items-center justify-between rounded-md p-2">
          <div>
            <span className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? "poll" : "polls"} selected
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
          >
            <TrashIcon className="mr-2 size-4" />
            <Trans i18nKey="delete" defaults="Delete" />
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Infinite scroll loader using VisibilityTrigger */}
      {hasNextPage && (
        <VisibilityTrigger
          onVisible={() => {
            if (!isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          className="mt-4 flex justify-center py-4"
        >
          <div className="flex items-center">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            <span>Loading more polls...</span>
          </div>
        </VisibilityTrigger>
      )}

      {!hasNextPage && allPolls.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {allPolls.length} of {totalPolls} polls
        </div>
      )}

      <DeletePollsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        pollIds={selectedPollIds}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
