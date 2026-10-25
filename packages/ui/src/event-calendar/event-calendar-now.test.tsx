import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import {
  EventCalendar,
  EventCalendarContent,
  EventCalendarWeekView,
} from "./event-calendar";

// jsdom has no layout APIs; the grid only needs them to exist.
beforeAll(() => {
  Element.prototype.scrollTo ??= () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const todayColumn = (getNow?: () => Date) => {
  const { container } = render(
    <EventCalendar
      events={[]}
      date={new Date("2026-11-04T12:00:00Z")}
      defaultView="week"
      views={["week"]}
      timeZone="UTC"
      getNow={getNow}
    >
      <EventCalendarContent components={{ week: EventCalendarWeekView }} />
    </EventCalendar>,
  );
  const column = container.querySelector(
    '[data-slot="event-calendar-day-column"][data-today]',
  );
  return column ? new Date(Number(column.getAttribute("data-ec-day"))) : null;
};

describe("getNow", () => {
  it("decides which day is today", () => {
    expect(todayColumn(() => new Date("2026-11-03T23:30:00Z"))).toEqual(
      new Date("2026-11-03T00:00:00Z"),
    );
    expect(todayColumn(() => new Date("2026-11-05T00:30:00Z"))).toEqual(
      new Date("2026-11-05T00:00:00Z"),
    );
  });
});
