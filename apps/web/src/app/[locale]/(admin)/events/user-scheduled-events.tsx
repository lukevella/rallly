"use client";

import { RadioCards, RadioCardsItem } from "@rallly/ui/radio-pills";
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
    <div className="space-y-4">
      <div>
        <RadioCards
          value={period}
          onValueChange={(value) => {
            const newParams = new URLSearchParams(searchParams?.toString());
            newParams.set("period", value);
            window.history.pushState(null, "", `?${newParams.toString()}`);
          }}
        >
          <RadioCardsItem value="upcoming">
            <Trans i18nKey="upcoming" defaults="Upcoming" />
          </RadioCardsItem>
          <RadioCardsItem value="past">
            <Trans i18nKey="past" defaults="Past" />
          </RadioCardsItem>
        </RadioCards>
      </div>
      <div>
        {period === "upcoming" && <UpcomingEvents />}
        {period === "past" && <PastEvents />}
      </div>
    </div>
  );
}
