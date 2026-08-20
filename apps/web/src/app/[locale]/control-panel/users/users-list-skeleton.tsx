import { Skeleton } from "@rallly/ui/skeleton";
import { StackedList, StackedListItem } from "@/components/stacked-list";

export function UsersListSkeleton() {
  return (
    <StackedList className="text-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <StackedListItem
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
          key={index}
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24 sm:hidden" />
          </div>
          <Skeleton className="hidden h-4 w-24 sm:block" />
        </StackedListItem>
      ))}
    </StackedList>
  );
}
