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
import { Trans } from "react-i18next";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";

import { type SimplifiedPoll, useColumns } from "./columns";
import { DeletePollsDialog } from "./delete-polls-dialog";
import { SearchInput } from "./search-input";
import { SelectionActionBar } from "./selection-action-bar";

type PollsTableProps = {
  polls: SimplifiedPoll[];
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
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  // Dialog state for delete polls
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedPollIds, setSelectedPollIds] = React.useState<string[]>([]);

  // Row selection state
  const [rowSelection, setRowSelection] = React.useState({});

  // Get columns for the table
  const columns = useColumns();

  // Create table instance
  const table = useReactTable({
    data: polls,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
  });

  // Calculate pagination values
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalPolls);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Handle delete selected
  const handleDeleteSelected = () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => polls[parseInt(index)].id,
    );

    if (selectedIds.length > 0) {
      setSelectedPollIds(selectedIds);
      setIsDeleteDialogOpen(true);
    }
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    setRowSelection({});
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setRowSelection({});
  };

  // Get selected count
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="w-full sm:w-96">
          <SearchInput />
        </div>
      </div>

      <div className="rounded-md border">
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
                      <Trans i18nKey="noPolls" />
                    </EmptyStateTitle>
                    <EmptyStateDescription>
                      <Trans i18nKey="noPollsDescription" />
                    </EmptyStateDescription>
                    <EmptyStateFooter>
                      <Button variant="primary" asChild>
                        <Link href="/new">
                          <Icon>
                            <PlusIcon />
                          </Icon>
                          <Trans i18nKey="createPoll" />
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
              values={{ startItem, endItem, totalPolls }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              <Trans i18nKey="page" values={{ currentPage, totalPages }} />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection Action Bar */}
      {selectedCount > 0 && (
        <SelectionActionBar
          selectedCount={selectedCount}
          onDelete={handleDeleteSelected}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Delete Dialog */}
      <DeletePollsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        pollIds={selectedPollIds}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
