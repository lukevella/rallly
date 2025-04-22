"use client";

import dayjs from "dayjs";
import React from "react";

import { useTimezone } from "./client/context";
import { FormattedDateTime } from "./client/formatted-date-time";

export const TimezoneDisplay = () => {
  const { timezone } = useTimezone();
  const now = dayjs();

  return (
    <div className="space-y-4 rounded border p-4">
      <h2 className="text-lg font-semibold">Timezone Information</h2>
      <p>
        Current Timezone: <code className="font-mono">{timezone}</code>
      </p>

      <div className="space-y-2">
        <h3 className="font-medium">Formatted Examples:</h3>
        <p>
          Default Format: <FormattedDateTime date={now} />
        </p>
        <p>
          Custom Date (YYYY-MM-DD):{" "}
          <FormattedDateTime date={now} format="YYYY-MM-DD" />
        </p>
        <p>
          Custom Time (h:mm A): <FormattedDateTime date={now} format="h:mm A" />
        </p>
        <p>
          Custom DateTime (MMM D, hh:mm):{" "}
          <FormattedDateTime date={now} format="MMM D, hh:mm" />
        </p>
        <p>
          Floating Time (HH:mm):{" "}
          <FormattedDateTime date={now} format="HH:mm" floating={true} />
        </p>
        <p>
          Locale (French): <FormattedDateTime date={now} locale="fr" />
        </p>
        <p>
          Locale & Format (French):{" "}
          <FormattedDateTime
            date={now}
            locale="fr"
            format="dddd D MMMM YYYY HH:mm"
          />
        </p>
      </div>

      {/* Example with an explicit date string */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="font-medium">Explicit Date Example:</h3>
        <p>
          ISO String Input: <code>2024-01-15T14:30:00Z</code>
        </p>
        <p>
          Formatted (Context Timezone):{" "}
          <FormattedDateTime date="2024-01-15T14:30:00Z" format="LLLL" />
        </p>
        <p>
          Formatted (Floating):{" "}
          <FormattedDateTime
            date="2024-01-15T14:30:00Z"
            format="HH:mm:ss"
            floating={true}
          />
        </p>
      </div>
    </div>
  );
};
