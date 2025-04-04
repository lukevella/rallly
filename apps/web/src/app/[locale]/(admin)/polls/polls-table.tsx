"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rallly/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import {
  PollSelectionProvider,
  usePollSelection,
} from "@/features/poll-selection/context";

import { type PollRow, useColumns } from "./columns";

type PollsTableProps = {
  polls: PollRow[];
  totalPolls: number;
  currentPage: number;
  totalPages: number;
};

export function PollsTable({
  polls,
  totalPolls,
  currentPage,
  totalPages,
}: PollsTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get page size from URL or default to 10
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const { selectedPolls, setSelectedPolls } = usePollSelection();
  // Get columns for the table
  const columns = useColumns();

  // Create table instance
  const table = useReactTable({
    data: polls,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        setSelectedPolls(updaterOrValue(selectedPolls));
      } else {
        setSelectedPolls(updaterOrValue);
      }
    },
    state: {
      rowSelection: selectedPolls,
    },
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  // Calculate pagination values
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalPolls);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() }}
                  >
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
            {polls.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-96 text-center"
                >
                  <EmptyState>
                    <EmptyStateIcon>
                      <InboxIcon />
                    </EmptyStateIcon>
                    <EmptyStateTitle>
                      <Trans i18nKey="noPollsFound" defaults="No polls found" />
                    </EmptyStateTitle>
                    <EmptyStateDescription>
                      <Trans
                        i18nKey="noPollsFoundDescription"
                        defaults="You don't have any polls yet. Create one to get started!"
                      />
                    </EmptyStateDescription>
                    <EmptyStateFooter>
                      <Button variant="primary" asChild>
                        <Link href="/new">
                          <Icon>
                            <PlusIcon />
                          </Icon>
                          <Trans
                            i18nKey="createPoll"
                            defaults="Create a poll"
                          />
                        </Link>
                      </Button>
                    </EmptyStateFooter>
                  </EmptyState>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap"
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      {totalPolls > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <Trans
              i18nKey="showingPolls"
              defaults="Showing {startItem} to {endItem} of {totalPolls} polls"
              values={{ startItem, endItem, totalPolls }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              <Trans
                i18nKey="pageXofY"
                defaults="Page {currentPage} of {totalPages}"
                values={{ currentPage, totalPages }}
              />
            </div>
            <Button
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
