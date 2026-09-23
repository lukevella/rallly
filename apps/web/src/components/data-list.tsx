"use client";

import { cn } from "@rallly/ui";
import type { RowData, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Classes for the column's cells, e.g. to hide it on small screens */
    className?: string;
  }
}

/**
 * Renders a TanStack table as a list laid out on a CSS grid. Rows are
 * subgrids of the root, so `className` sets `grid-cols-*` once and every
 * row's columns line up. A cell hidden with `display: none` gives up its
 * track, so the template must list only the columns visible at each
 * breakpoint.
 *
 * To make a whole row clickable, render a link in one cell with an
 * `after:absolute after:inset-0` overlay and give other interactive cells
 * `relative z-10` so they sit above it.
 */
export function DataList<TData>({
  table,
  className,
}: {
  table: Table<TData>;
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-x-5 px-2 py-2 md:px-4", className)}>
      {table.getRowModel().rows.map((row) => (
        <li
          key={row.id}
          className="relative col-span-full grid h-12 grid-cols-subgrid items-center rounded-lg pr-3 pl-4 hover:bg-accent/60 has-[a:focus-visible]:bg-accent/60"
        >
          {row.getVisibleCells().map((cell) => (
            <div
              key={cell.id}
              className={cn(
                "flex min-w-0 items-center",
                cell.column.columnDef.meta?.className,
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}
