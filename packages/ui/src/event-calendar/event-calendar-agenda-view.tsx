// Title: Event Calendar Agenda View
// Description: Chronological agenda grouped by day - a day header row plus a clean time / dot / title table.

"use client"

import { useMemo } from "react"
import {
  EventCalendarViewContext,
  useEventCalendar,
  useEventCalendarSelector,
  useEventCalendarSettings,
  useEventCalendarViewConfig,
} from "@/components/reui/event-calendar/event-calendar"
import { EventCalendarEvent } from "@/components/reui/event-calendar/event-calendar-event"
import {
  getDayKey,
  getRangeKey,
  toZoned,
  zonedStartOfDay,
} from "@/components/reui/event-calendar/event-calendar-lib"
import type {
  EventCalendarDateRange,
  EventCalendarSegment,
} from "@/components/reui/event-calendar/event-calendar-types"
import { IconStack } from "@/components/reui/icon-stack"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { addDays, format } from "date-fns"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

// The agenda window length is the agendaDayCount SETTING (the store derives
// visibleRange from it); a per-view prop here would silently disagree.
type EventCalendarAgendaViewProps = useRender.ComponentProps<"div">

function EventCalendarAgendaView({
  className,
  render,
  ...props
}: EventCalendarAgendaViewProps) {
  const instance = useEventCalendar()
  const settings = useEventCalendarSettings()
  const viewConfig = useEventCalendarViewConfig()
  const visibleRange = useEventCalendarSelector<
    unknown,
    EventCalendarDateRange
  >((state) => state.visibleRange, {
    isEqual: (a, b) => getRangeKey(a) === getRangeKey(b),
  })
  // Subscribe to event changes via the day-bucket content of the whole range
  useEventCalendarSelector((state) => state.events)

  const days = useMemo(() => {
    const result: Date[] = []
    let cursor = zonedStartOfDay(visibleRange.start, settings.timeZone)
    while (cursor < visibleRange.end) {
      result.push(cursor)
      cursor = zonedStartOfDay(
        addDays(toZoned(cursor, settings.timeZone), 1),
        settings.timeZone
      )
    }
    return result
  }, [visibleRange, settings.timeZone])

  const index = instance.internals.getIndex()
  const groups = days
    .map((day) => ({
      day,
      bucket: index.byDay.get(getDayKey(day, settings.timeZone)),
    }))
    .filter((group) => {
      const total =
        (group.bucket?.allDay.length ?? 0) + (group.bucket?.timed.length ?? 0)
      return total > 0
    })

  const isToday = (day: Date) =>
    getDayKey(day, settings.timeZone) ===
    getDayKey(new Date(), settings.timeZone)

  const native = viewConfig.scrollbars === "native"

  const body = (
    <>
      {groups.length === 0 ? (
        <div
          data-slot="event-calendar-no-events"
          className={cn(
            "flex min-h-72 flex-col items-center justify-center gap-4 py-16",
            viewConfig.classNames?.noEvents
          )}
        >
          {viewConfig.renderNoEvents?.() ?? (
            <>
              <IconStack>
                <IconPlaceholder
                  lucide="CalendarIcon"
                  tabler="IconCalendarEvent"
                  hugeicons="Calendar04Icon"
                  phosphor="CalendarBlankIcon"
                  remixicon="RiCalendarLine"
                  className="size-5"
                  aria-hidden="true"
                />
              </IconStack>
              <span className="text-muted-foreground text-sm">
                {settings.i18n.labels.noEvents}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {groups.map(({ day, bucket }) => {
            const items = [...(bucket?.allDay ?? []), ...(bucket?.timed ?? [])]
            const zoned = toZoned(day, settings.timeZone)
            return (
              <div
                key={day.getTime()}
                data-slot="event-calendar-agenda-day"
                data-today={isToday(day) || undefined}
              >
                {/* Group header: weekday (leading) + full date (trailing) */}
                <div
                  data-slot="event-calendar-agenda-day-header"
                  className={cn(
                    "bg-muted/60 sticky top-0 z-10 flex items-baseline justify-between gap-4 border-b px-4 py-2",
                    viewConfig.classNames?.agendaDayHeader
                  )}
                >
                  <span
                    className={cn(
                      "text-foreground font-semibold",
                      isToday(day) && "text-primary"
                    )}
                  >
                    {format(zoned, "EEEE", { locale: settings.locale })}
                  </span>
                  <span className="text-muted-foreground font-medium tabular-nums">
                    {format(zoned, "MMMM d, yyyy", { locale: settings.locale })}
                  </span>
                </div>
                {items.map((segment) => (
                  <EventCalendarAgendaItem
                    key={segment.occurrence.key}
                    segment={segment}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  const defaultProps = {
    "data-slot": "event-calendar-agenda-view",
    "data-view": "agenda",
    className: cn(
      "flex min-h-0 flex-1 flex-col overflow-hidden border-t",
      viewConfig.classNames?.agendaView,
      className
    ),
    children: native ? (
      <div
        data-slot="scroll-area-viewport"
        data-ec-native-scroll=""
        className="h-full overflow-y-auto"
      >
        {body}
      </div>
    ) : (
      <ScrollArea className="h-full">{body}</ScrollArea>
    ),
  }

  return (
    <EventCalendarViewContext.Provider value={{ view: "agenda" }}>
      {useRender({
        defaultTagName: "div",
        render,
        props: mergeProps<"div">(defaultProps, props),
      })}
    </EventCalendarViewContext.Provider>
  )
}

/**
 * One agenda row: a full-width, selectable table row - time column, color dot,
 * and title (all replaceable via renderAgendaEvent). Clicking selects the
 * event (drag/resize stay off in the agenda).
 */
function EventCalendarAgendaItem({
  segment,
}: {
  segment: EventCalendarSegment
}) {
  const viewConfig = useEventCalendarViewConfig()
  return (
    <EventCalendarEvent
      segment={segment}
      className={cn(
        // read-only list: hover only, no selected/focused styling on click
        "hover:bg-accent/40 gap-3 rounded-none border-b px-4 py-2.5 transition-colors",
        viewConfig.classNames?.agendaItem
      )}
    />
  )
}

export { EventCalendarAgendaView }
export type { EventCalendarAgendaViewProps }