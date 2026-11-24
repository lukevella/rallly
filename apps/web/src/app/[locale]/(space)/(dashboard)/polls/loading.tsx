import {
  ListView,
  ListViewColumn,
  ListViewContent,
  ListViewHeader,
  ListViewPageTitleSkeleton,
  ListViewToolbarSkeleton,
} from "@/components/list-view";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { PollsListSkeleton } from "@/features/poll/components/polls-list";

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <ListView>
        <ListViewHeader>
          <ListViewColumn>
            <ListViewPageTitleSkeleton />
            <ListViewToolbarSkeleton action />
          </ListViewColumn>
        </ListViewHeader>
        <ListViewContent>
          <ListViewColumn className="pb-8">
            <PollsListSkeleton />
          </ListViewColumn>
        </ListViewContent>
      </ListView>
    </>
  );
}
