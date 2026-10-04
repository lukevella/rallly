"use client";

import { Card } from "@rallly/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

type ResultsView = "grid" | "list";

// The URL keeps the view so reloads and shared links land on it; both panels
// are already rendered, so switching doesn't refetch.
function syncViewParam(view: ResultsView) {
  const url = new URL(window.location.href);
  if (view === "list") {
    url.searchParams.set("view", "list");
  } else {
    url.searchParams.delete("view");
  }
  window.history.replaceState(null, "", url);
}

export function PollResultsTabs({
  defaultView,
  aside,
  grid,
  list,
}: {
  defaultView: ResultsView;
  aside?: React.ReactNode;
  grid: React.ReactNode;
  list: React.ReactNode;
}) {
  return (
    <Tabs
      defaultValue={defaultView}
      onValueChange={(value) => syncViewParam(value as ResultsView)}
      className="flex h-full flex-col"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 md:px-6">
        <TabsList>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGridIcon className="size-4" />
            <Trans i18nKey="pollResultsGridView" defaults="Grid" />
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <ListIcon className="size-4" />
            <Trans i18nKey="pollResultsListView" defaults="List" />
          </TabsTrigger>
        </TabsList>
        {aside}
      </div>
      <TabsContent
        value="grid"
        className="min-h-0 flex-1 px-4 pb-4 md:px-6 md:pb-6"
      >
        <Card className="flex max-h-full flex-col">{grid}</Card>
      </TabsContent>
      <TabsContent
        value="list"
        className="min-h-0 flex-1 px-4 pb-4 md:px-6 md:pb-6"
      >
        <Card className="flex max-h-full flex-col">{list}</Card>
      </TabsContent>
    </Tabs>
  );
}
