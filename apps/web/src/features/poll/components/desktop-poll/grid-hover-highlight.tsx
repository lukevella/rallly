"use client";

import * as React from "react";

/**
 * Highlights the row and column under the pointer, so a cell can be traced
 * to its participant and its option. The row is plain CSS; the column is one
 * rule written for the hovered `data-col`, kept in this component so the
 * table does not re-render as the pointer moves. The tint is opaque, because
 * the sticky name and header cells must still cover what scrolls beneath.
 * The column's ends are rounded so it reads as one strip, except where it
 * meets a highlighted last row, which would leave notches in the row.
 */
export function GridHoverHighlight({
  tableRef,
}: {
  tableRef: React.RefObject<HTMLTableElement | null>;
}) {
  const [column, setColumn] = React.useState<string | null>(null);

  React.useEffect(() => {
    const table = tableRef.current;
    if (!table) {
      return;
    }
    const onOver = (event: MouseEvent) => {
      const cell = (event.target as Element).closest("[data-col]");
      setColumn(cell?.getAttribute("data-col") ?? null);
    };
    const onLeave = () => setColumn(null);
    table.addEventListener("mouseover", onOver);
    table.addEventListener("mouseleave", onLeave);
    return () => {
      table.removeEventListener("mouseover", onOver);
      table.removeEventListener("mouseleave", onLeave);
    };
  }, [tableRef]);

  return (
    <style>{`
      .poll-grid tbody tr:hover > td { background-color: var(--grid-hover); }
      ${
        column !== null
          ? `
        .poll-grid [data-col="${column}"] { background-color: var(--grid-hover); }
        .poll-grid thead [data-col="${column}"] { border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; }
        .poll-grid tbody tr:last-child:not(:hover) [data-col="${column}"] { border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
      `
          : ""
      }
    `}</style>
  );
}
