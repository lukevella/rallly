import {
  ListView,
  ListViewColumn,
  ListViewContent,
  ListViewHeader,
  ListViewPageTitleSkeleton,
  ListViewToolbarSkeleton,
} from "@/components/list-view";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { EventsListSkeleton } from "./events-list";

export default function Loading() {
  return (
    <>
      <RouterLoadingIndicator />
      <ListView>
        <ListViewHeader>
          <ListViewColumn>
            <ListViewPageTitleSkeleton />
            <ListViewToolbarSkeleton />
          </ListViewColumn>
        </ListViewHeader>
        <ListViewContent>
          <ListViewColumn className="pb-8">
            <EventsListSkeleton />
          </ListViewColumn>
        </ListViewContent>
      </ListView>
    </>
  );
}
