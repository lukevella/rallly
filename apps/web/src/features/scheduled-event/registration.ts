import type { ScheduledEventStatus } from "@rallly/database";

export type EventPhase = "canceled" | "ended" | "inProgress" | "upcoming";

/**
 * Resolves the registration-relevant phase of an event. Registration is only
 * open while the event is "upcoming"; every other phase blocks it.
 */
export function getEventPhase({
  status,
  start,
  end,
  now,
}: {
  status: ScheduledEventStatus;
  start: Date;
  end: Date;
  now: Date;
}): EventPhase {
  if (status === "canceled") {
    return "canceled";
  }
  if (now > end) {
    return "ended";
  }
  if (now >= start) {
    return "inProgress";
  }
  return "upcoming";
}

export function isEventFull({
  capacity,
  acceptedCount,
}: {
  capacity: number | null;
  acceptedCount: number;
}) {
  return capacity !== null && acceptedCount >= capacity;
}
