"use client";

import { Table, TableBody, TableCell, TableRow } from "@rallly/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import type { PollRow } from "./polls/columns";
import { useColumns } from "./polls/columns";

type RecentPollsTableProps = {
  polls: PollRow[];
};

export const RecentPollsTable = ({ polls }: RecentPollsTableProps) => {
  // Get columns but exclude selection and action columns for recent polls
  const columns = useColumns([
    "title",
    "dateRange",
    "participants",
    "createdDate",
    "actionButtons",
  ]);

  const table = useReactTable({
    data: polls,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          {polls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                You don&apos;t have any recent polls
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
