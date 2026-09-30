"use client";

import { cn } from "@rallly/ui";
import type { Row, RowData, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type React from "react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Classes for the column's cells, e.g. to hide it on small screens */
    className?: string;
  }
}

type DataListGroup = { id: string; label: React.ReactNode };

function DataListRow<TData>({
  row,
  className,
}: {
  row: Row<TData>;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "relative col-span-full grid h-12 grid-cols-subgrid items-center rounded-lg pr-3 pl-4 hover:bg-accent/60 has-[a:focus-visible]:bg-accent/60 has-[a[aria-current=page]]:bg-accent",
        className,
      )}
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
  );
}

/**
 * Renders a TanStack table as a list laid out on a CSS grid. Rows are
 * subgrids of the root, so `className` sets `grid-cols-*` once and every
 * row's columns line up. A cell hidden with `display: none` gives up its
 * track, so the template must list only the columns visible at each
 * breakpoint.
 *
 * `getGroup` splits the rows into labelled groups. Rows are grouped where
 * they are adjacent, so sort them by group first.
 *
 * To make a whole row clickable, render a link in one cell with an
 * `after:absolute after:inset-0` overlay and give other interactive cells
 * `relative z-10` so they sit above it.
 *
 * `getRowClassName` styles a row from its data, e.g. to tint it by state.
 */
export function DataList<TData>({
  table,
  getGroup,
  getRowClassName,
  rowGapClassName,
  className,
}: {
  table: Table<TData>;
  getGroup?: (row: TData) => DataListGroup;
  getRowClassName?: (row: TData) => string | undefined;
  /** Space between rows, e.g. when rows carry their own background. */
  rowGapClassName?: string;
  className?: string;
}) {
  const rows = table.getRowModel().rows;

  if (!getGroup) {
    return (
      <ul className={cn("grid gap-x-5 px-4 py-2", rowGapClassName, className)}>
        {rows.map((row) => (
          <DataListRow
            key={row.id}
            row={row}
            className={getRowClassName?.(row.original)}
          />
        ))}
      </ul>
    );
  }

  const groups: { group: DataListGroup; rows: Row<TData>[] }[] = [];
  for (const row of rows) {
    const group = getGroup(row.original);
    const last = groups[groups.length - 1];
    if (last?.group.id === group.id) {
      last.rows.push(row);
    } else {
      groups.push({ group, rows: [row] });
    }
  }

  return (
    <ul className={cn("grid gap-x-5 px-4 py-2", className)}>
      {groups.map(({ group, rows }) => (
        <li
          key={group.id}
          className="col-span-full not-first:mt-5 grid grid-cols-subgrid"
        >
          <h2 className="col-span-full mb-1 flex h-12 items-center gap-2 rounded-lg bg-muted/60 px-4 text-sm">
            {group.label}
          </h2>
          <ul
            className={cn(
              "col-span-full grid grid-cols-subgrid",
              rowGapClassName,
            )}
          >
            {rows.map((row) => (
              <DataListRow
                key={row.id}
                row={row}
                className={getRowClassName?.(row.original)}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
