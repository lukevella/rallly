import { Skeleton } from "@rallly/ui/skeleton";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitleSkeleton,
} from "@/components/page";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";

// Shaped like the home page. Other dashboard routes provide their own
// loading.tsx so they don't inherit it.
export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShell>
        <PageHeader>
          <PageColumn>
            <PageTitleSkeleton />
          </PageColumn>
        </PageHeader>
        <PageContent>
          <PageColumn className="pb-8">
            <div aria-hidden className="space-y-8 px-4 pt-6">
              {[1, 3, 3].map((tileCount, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
                <div key={i} className="space-y-4">
                  <Skeleton className="h-5 w-20" />
                  <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: tileCount }).map((_, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
                      <Skeleton key={j} className="h-[76px] rounded-xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PageColumn>
        </PageContent>
      </PageShell>
    </>
  );
}
