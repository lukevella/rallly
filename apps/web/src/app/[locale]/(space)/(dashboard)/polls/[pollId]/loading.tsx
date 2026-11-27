import { Skeleton } from "@rallly/ui/skeleton";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitleSkeleton,
} from "@/components/page";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { PollBreadcrumb } from "./components/poll-breadcrumb";

/**
 * The page's outline: title and facts, the share bar, the two stat cards, the
 * results card and the activity log.
 */
export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShell nav={<PollBreadcrumb />}>
        <PageHeader>
          <PageColumn>
            <PageTitleSkeleton />
            <div aria-hidden className="flex gap-5 px-4 pt-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          </PageColumn>
        </PageHeader>
        <PageContent>
          <PageColumn>
            <div aria-hidden className="flex flex-col gap-8 px-4 pt-6 pb-16">
              <section className="flex h-15 items-center justify-between gap-4 rounded-xl bg-card px-5 shadow-black/5 shadow-lg ring-1 ring-button-outline ring-inset dark:bg-foreground/5 dark:shadow-black/20 dark:shadow-md">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-56" />
              </section>
              <div className="flex gap-4 overflow-hidden">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex min-h-32 min-w-72 flex-1 flex-col justify-between rounded-xl bg-card p-4 ring-1 ring-button-outline ring-inset sm:min-w-64 dark:bg-foreground/5"
                  >
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
              <section className="overflow-hidden rounded-xl border border-button-outline bg-card dark:bg-foreground/5">
                <div className="flex h-14 items-center justify-between border-button-outline border-b px-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-48" />
                </div>
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
                    key={i}
                    className="flex h-14 items-center gap-4 border-button-outline border-b px-5 last:border-b-0"
                  >
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </section>
              <section className="flex flex-col gap-4 px-1">
                <Skeleton className="h-4 w-16" />
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
                    key={i}
                    className="flex items-center gap-3"
                  >
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </PageColumn>
        </PageContent>
      </PageShell>
    </>
  );
}
