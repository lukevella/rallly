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
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";

import { PollStatusBadge } from "@/components/poll-status";
import { Trans } from "@/components/trans";

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

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  const [didCopy, setDidCopy] = React.useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={didCopy}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        copy(`${window.location.origin}/invite/${pollId}`);
        setDidCopy(true);
        setTimeout(() => {
          setDidCopy(false);
        }, 1000);
      }}
      className="relative z-20"
    >
      {didCopy ? (
        <>
          <CheckIcon className="size-4" />
          <Trans i18nKey="copied" defaults="Copied" />
        </>
      ) : (
        <>
          <LinkIcon className="size-4" />
          <Trans i18nKey="copyLink" defaults="Copy Link" />
        </>
      )}
    </Button>
  );
}

type PollsTableProps = {
  polls: SimplifiedPoll[];
  totalPages?: number;
  currentPage?: number;
  totalPolls?: number;
};

export function PollsTable({ 
  polls,
  totalPages = 1,
  currentPage = 1,
  totalPolls = 0,
}: PollsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedPollIds, setSelectedPollIds] = React.useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
          <Link
            href={`/poll/${info.row.original.id}`}
            className="font-medium hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor((row) => row.status, {
        id: "pollStatus",
        header: () => <span>Status</span>,
        cell: (info) => <PollStatusBadge status={info.getValue()} />,
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
        cell: (info) => <CopyLinkButton pollId={info.row.original.id} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: polls,
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
      (index) => polls[parseInt(index)].id,
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

  // Create pagination links
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Generate array of page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at edges
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (polls.length === 0) {
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
      
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            {currentPage > 1 && (
              <Link
                href={createPageUrl(currentPage - 1)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ChevronLeftIcon className="mr-1 size-4" />
                Previous
              </Link>
            )}
            
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page < 0 ? (
                    <span className="flex h-9 w-9 items-center justify-center text-sm">
                      ...
                    </span>
                  ) : (
                    <Link
                      href={createPageUrl(page)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-primary text-primary-foreground"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {currentPage < totalPages && (
              <Link
                href={createPageUrl(currentPage + 1)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Next
                <ChevronRightIcon className="ml-1 size-4" />
              </Link>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {polls.length} of {totalPolls} polls
          </div>
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
