"use client";

import { Button } from "@rallly/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rallly/ui/table";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";

import { Trans } from "@/components/trans";

import { type SimplifiedPoll, useColumns } from "./columns";
import { DeletePollsDialog } from "./delete-polls-dialog";
import { SearchInput } from "./search-input";
import { SelectionActionBar } from "./selection-action-bar";

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
  q,
}: {
  pageParam?: number;
  status?: string;
  q?: string;
}) {
  const params = new URLSearchParams();
  params.set("page", pageParam.toString());
  if (status) {
    params.set("status", status);
  }
  if (q) {
    params.set("q", q);
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
  initialSearch?: string;
};

// Memoize the entire PollsTable component to prevent unnecessary re-renders
export const PollsTable = React.memo(function PollsTable({
  initialPolls,
  initialTotalPolls,
  initialHasNextPage,
  initialSearch,
}: PollsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedPollIds, setSelectedPollIds] = React.useState<string[]>([]);
  const searchParams = useSearchParams();

  // Get status from URL if available
  const status = searchParams.get("status") || undefined;

  // Get search query from URL if available
  const searchQuery = searchParams.get("q") || undefined;

  // Use React Query's useInfiniteQuery for data fetching
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = useInfiniteQuery({
    queryKey: ["polls", status, searchQuery],
    queryFn: ({ pageParam }) =>
      fetchPolls({ pageParam, status, q: searchQuery }),
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
  const allPolls = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.polls) || [];
  }, [data?.pages]);

  const totalPolls = data?.pages[0]?.totalPolls || 0;

  // Get columns from our custom hook
  const columns = useColumns();

  // Memoize the table instance
  const table = useReactTable({
    data: allPolls,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    defaultColumn: {
      minSize: 50,
      maxSize: 500,
    },
  });

  const handleDeleteSelected = React.useCallback(() => {
    // Get selected row IDs
    const selectedIds = Object.keys(rowSelection).map(
      (index) => allPolls[parseInt(index)].id,
    );

    if (selectedIds.length > 0) {
      // Set the selected poll IDs and open the confirmation dialog
      setSelectedPollIds(selectedIds);
      setIsDeleteDialogOpen(true);
    }
  }, [rowSelection, allPolls]);

  const handleDeleteSuccess = React.useCallback(() => {
    // After successful deletion, clear selection
    setRowSelection({});
  }, []);

  const handleClearSelection = React.useCallback(() => {
    // Clear all row selections
    setRowSelection({});
  }, []);

  const handleLoadMore = React.useCallback(() => {
    // Only fetch if we have a next page and we're not already fetching
    // This relies on React Query's isFetchingNextPage state
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  return (
    <div className="space-y-4">
      <div>
        <SearchInput initialValue={initialSearch} />
      </div>
      {allPolls.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            {searchQuery ? (
              <Trans
                i18nKey="noPolls"
                defaults="No polls found matching '{search}'"
                values={{ search: searchQuery }}
              />
            ) : (
              <Trans
                i18nKey="noPolls"
                defaults="You don't have any polls yet"
              />
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`group ${row.getIsSelected() ? "bg-primary/5" : ""}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                          overflow: "hidden",
                        }}
                        className="overflow-hidden"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {allPolls.length > 0 && (
            <div className="mt-4 py-2 text-center text-sm text-gray-500">
              Showing {allPolls.length} of {totalPolls} polls
            </div>
          )}

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      <SelectionActionBar
        selectedCount={selectedCount}
        onDelete={handleDeleteSelected}
        onClearSelection={handleClearSelection}
      />

      <DeletePollsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        pollIds={selectedPollIds}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
});
