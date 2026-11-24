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

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShell>
        <PageHeader>
          <PageColumn>
            <PageTitleSkeleton />
            <PageToolbarSkeleton tabs={false} action />
          </PageColumn>
        </PageHeader>
        <PageContent className="pt-2">
          <PageColumn className="pb-8">
            <div aria-hidden className="py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
                  key={i}
                  className="flex h-12 items-center gap-3 px-8"
                >
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </PageColumn>
        </PageContent>
      </PageShell>
    </>
  );
}
