"use client";

import {
  QueryTabs,
  QueryTabsContent,
  QueryTabsList,
  QueryTabsTrigger,
} from "@rallly/ui/query-tabs";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { PastEvents } from "@/app/[locale]/(admin)/events/past-events";
import { Trans } from "@/components/trans";

import { UpcomingEvents } from "./upcoming-events";

const eventPeriodSchema = z.enum(["upcoming", "past"]).catch("upcoming");

export function UserScheduledEvents() {
  const searchParams = useSearchParams();
  const period = eventPeriodSchema.parse(searchParams?.get("period"));

  return (
    <QueryTabs
      value={period}
      onValueChange={(value) => {
        const newParams = new URLSearchParams(searchParams?.toString());
        newParams.set("period", value);
        window.history.pushState(null, "", `?${newParams.toString()}`);
      }}
    >
      <div className="space-y-4">
        <QueryTabsList>
          <QueryTabsTrigger value="upcoming">
            <Trans i18nKey="upcoming" defaults="Upcoming" />
          </QueryTabsTrigger>
          <QueryTabsTrigger value="past">
            <Trans i18nKey="past" defaults="Past" />
          </QueryTabsTrigger>
        </QueryTabsList>
        <QueryTabsContent value="upcoming">
          <UpcomingEvents />
        </QueryTabsContent>
        <QueryTabsContent value="past">
          <PastEvents />
        </QueryTabsContent>
      </div>
    </QueryTabs>
  );
}
