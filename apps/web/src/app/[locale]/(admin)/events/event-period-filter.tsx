"use client";

import { Tabs, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { Trans } from "@/components/trans";

const eventPeriodSchema = z.enum(["upcoming", "past"]).catch("upcoming");

export function EventPeriodFilter() {
  const searchParams = useSearchParams();
  const period = eventPeriodSchema.parse(searchParams?.get("period"));

  const router = useRouter();

  return (
    <Tabs
      value={period}
      onValueChange={(value) => {
        const newParams = new URLSearchParams(searchParams?.toString());
        newParams.set("period", value);
        router.push(`/events?${newParams.toString()}`);
      }}
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
  );
}
