import { Skeleton } from "@rallly/ui/skeleton";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitleSkeleton,
  PageToolbarSkeleton,
} from "@/components/page";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { EventsListSkeleton } from "@/features/scheduled-event/components/events-list";

// Shaped like the home page. Other dashboard routes provide their own
// loading.tsx so they don't inherit it.
export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShell>
        <PageHeader>
          <PageColumn className="pb-3">
            <PageTitleSkeleton />
            <Skeleton aria-hidden className="mx-4 mt-2 h-4 w-48" />
          </PageColumn>
        </PageHeader>
        <PageContent>
          <PageColumn className="pb-8">
            <div aria-hidden className="flex gap-4 overflow-hidden px-4 pt-3">
              {["a", "b"].map((key) => (
                <Skeleton
                  key={key}
                  className="h-32 min-w-72 flex-1 rounded-xl sm:min-w-64"
                />
              ))}
            </div>
            <div className="pt-2">
              <PageToolbarSkeleton />
            </div>
            <EventsListSkeleton />
          </PageColumn>
        </PageContent>
      </PageShell>
    </>
  );
}
