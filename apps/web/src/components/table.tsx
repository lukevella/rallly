import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Flex } from "@rallly/ui/flex";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  OnChangeFn,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import React from "react";

import { Trans } from "@/components/trans";

export const Table = <TData extends Record<string, unknown>>(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  footer?: React.ReactNode;
  pageCount?: number;
  enableTableFooter?: boolean;
  enableTableHeader?: boolean;
  layout?: "fixed" | "auto";
  onPaginationChange?: OnChangeFn<PaginationState>;
  paginationState: PaginationState | undefined;
  className?: string;
}) => {
  const table = useReactTable<TData>({
    data: props.data,
    columns: props.columns,
    pageCount: props.pageCount,
    state: {
      pagination: props.paginationState,
    },
    manualPagination: true,
    onPaginationChange: props.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div
        className={cn(
          props.className,
          "scrollbar-thin  max-w-full overflow-x-auto",
        )}
      >
        <table
          className={cn(
            "border-collapse",
            props.layout === "auto" ? "w-full table-auto" : "table-fixed",
          )}
        >
          {props.enableTableHeader ? (
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        maxWidth:
                          props.layout === "auto"
                            ? header.getSize()
                            : undefined,
                      }}
                      className="border-b bg-gray-50 p-1"
                    >
                      <div className="flex h-7 items-center whitespace-nowrap rounded-md px-4 text-left align-bottom text-xs font-semibold hover:bg-gray-200">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          ) : null}
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    style={{
                      width: cell.column.getSize(),
                      maxWidth:
                        props.layout === "auto"
                          ? cell.column.getSize()
                          : undefined,
                    }}
                    key={cell.id}
                    className={cn(
                      "relative overflow-hidden border-gray-100 px-5 py-4 align-middle",
                      {
                        "border-b": table.getRowModel().rows.length !== i + 1,
                      },
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {props.enableTableFooter ? (
            <tfoot>
              {table.getFooterGroups().map((footerGroup) => (
                <tr key={footerGroup.id} className="relative">
                  {footerGroup.headers.map((header) => (
                    <th className="border-t bg-gray-50" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </tfoot>
          ) : null}
        </table>
      </div>
      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between space-x-2 border-t bg-gray-50 px-4 py-3 lg:px-5">
          <div>
            <span className="text-muted-foreground text-sm">
              <Trans
                i18nKey="pageXOfY"
                defaults="Page {currentPage} of {pageCount}"
                values={{
                  currentPage: table.getState().pagination.pageIndex + 1,
                  pageCount: table.getPageCount(),
                }}
              />
            </span>
          </div>
          <Flex>
            <Button
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ArrowLeftIcon
                className={cn("size-4", {
                  "text-gray-400": !table.getCanPreviousPage(),
                })}
              />
            </Button>

            <Button
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ArrowRightIcon className="size-4 text-gray-500" />
            </Button>
          </Flex>
        </div>
      ) : null}
    </div>
  );
};
