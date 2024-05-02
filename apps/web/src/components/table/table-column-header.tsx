import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <button
      className="flex w-full items-center gap-x-2.5"
      onClick={() => {
        column.toggleSorting();
      }}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <Icon>
          <ArrowDownIcon />
        </Icon>
      ) : column.getIsSorted() === "asc" ? (
        <Icon>
          <ArrowUpIcon />
        </Icon>
      ) : (
        <Icon>
          <ChevronsUpDownIcon />
        </Icon>
      )}
    </button>
  );
}
