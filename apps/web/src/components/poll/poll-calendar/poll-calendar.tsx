"use client";

import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { CalendarIcon, TableIcon } from "lucide-react";
import * as React from "react";

import { TimesShownIn } from "@/components/clock";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/i18n/client";

import { MonthView } from "./month-view";
import { usePollCalendar } from "./use-poll-calendar";
import { WeekView } from "./week-view";

export function PollCalendar() {
  const { dayKeys, pollType, timeZone } = usePollCalendar();
  const [view, setView] = React.useState<"month" | "week">("month");

  const showTimeZone = pollType === "timeSlot" && !!timeZone;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start justify-between gap-4 border-b sm:flex-row sm:items-center">
        <CardTitle>
          <Trans i18nKey="calendar" defaults="Calendar" />
        </CardTitle>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          {showTimeZone ? (
            <div className="flex items-center gap-4">
              <TimesShownIn />
              <span className="hidden h-4 w-px bg-border sm:block" />
            </div>
          ) : null}
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as "month" | "week")}
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger className="grow sm:grow-0" value="month">
                <CalendarIcon className="mr-2 size-4" />
                <Trans i18nKey="monthView" defaults="Month view" />
              </TabsTrigger>
              <TabsTrigger className="grow sm:grow-0" value="week">
                <TableIcon className="mr-2 size-4" />
                <Trans i18nKey="weekView" defaults="Week view" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      {dayKeys.length === 0 ? (
        <EmptyState className="p-16">
          <EmptyStateIcon>
            <CalendarIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans
              i18nKey="pollCalendarEmptyTitle"
              defaults="No dates to show"
            />
          </EmptyStateTitle>
          <EmptyStateDescription>
            <Trans
              i18nKey="pollCalendarEmptyDescription"
              defaults="This poll doesn't have any date options yet"
            />
          </EmptyStateDescription>
        </EmptyState>
      ) : view === "month" ? (
        <MonthView />
      ) : (
        <WeekView />
      )}
    </Card>
  );
}
