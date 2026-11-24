import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitleSkeleton,
  PageToolbarSkeleton,
} from "@/components/page";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { EventsListSkeleton } from "./events-list";

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <PageShell>
        <PageHeader>
          <PageColumn>
            <PageTitleSkeleton />
            <PageToolbarSkeleton />
          </PageColumn>
        </PageHeader>
        <PageContent>
          <PageColumn className="pb-8">
            <EventsListSkeleton />
          </PageColumn>
        </PageContent>
      </PageShell>
    </>
  );
}
