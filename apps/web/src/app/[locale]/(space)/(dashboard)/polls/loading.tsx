import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitleSkeleton,
  PageToolbarSkeleton,
} from "@/components/page";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { PollsListSkeleton } from "@/features/poll/components/polls-list";

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShell>
        <PageHeader>
          <PageColumn>
            <PageTitleSkeleton />
            <PageToolbarSkeleton action />
          </PageColumn>
        </PageHeader>
        <PageContent>
          <PageColumn className="pb-8">
            <PollsListSkeleton />
          </PageColumn>
        </PageContent>
      </PageShell>
    </>
  );
}
