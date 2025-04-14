"use client";

import { Tabs, TabsList, TabsTrigger } from "@rallly/ui/page-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { Trans } from "@/components/trans";

import { PastEvents } from "./past-events";
import { UpcomingEvents } from "./upcoming-events";

const eventPeriodSchema = z.enum(["upcoming", "past"]).catch("upcoming");

export function UserScheduledEvents() {
  const searchParams = useSearchParams();
  const period = eventPeriodSchema.parse(searchParams?.get("period"));
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Tabs
        value={searchParams.get("period") ?? "upcoming"}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams);
          params.set("period", value);
          const newUrl = `?${params.toString()}`;
          router.replace(newUrl);
        }}
        aria-label="Event period"
      >
        <TabsList>
          <TabsTrigger value="upcoming">
            <Trans i18nKey="upcoming" defaults="Upcoming" />
          </TabsTrigger>
          <TabsTrigger value="past">
            <Trans i18nKey="past" defaults="Past" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div>
        {period === "upcoming" && <UpcomingEvents />}
        {period === "past" && <PastEvents />}
      </div>
    </div>
  );
}
