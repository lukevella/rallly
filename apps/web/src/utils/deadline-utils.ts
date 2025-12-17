import dayjs from "dayjs";

export type DeadlineStatus = "upcoming" | "warning" | "urgent" | "passed";

/**
 * Calculate the deadline status based on hours remaining until deadline.
 * - "upcoming": More than 24 hours remaining
 * - "warning": Between 6 and 24 hours remaining
 * - "urgent": Less than 6 hours remaining
 * - "passed": Deadline has already passed
 */
export function calculateDeadlineStatus(deadline: Date | null): DeadlineStatus | null {
  if (!deadline) {
    return null;
  }

  const now = dayjs();
  const deadlineDate = dayjs(deadline);
  const hoursRemaining = deadlineDate.diff(now, "hour", true);

  if (hoursRemaining < 0) {
    return "passed";
  }
  if (hoursRemaining < 6) {
    return "urgent";
  }
  if (hoursRemaining < 24) {
    return "warning";
  }
  return "upcoming";
}

/**
 * Format deadline for display with timezone conversion.
 * Converts UTC deadline to user's timezone and formats it.
 */
export function formatDeadlineForDisplay(
  deadline: Date | null,
  timeZone: string | null,
): string | null {
  if (!deadline) {
    return null;
  }

  const deadlineDate = dayjs(deadline);
  let formattedDate: string;
  
  if (timeZone) {
    const tzDate = deadlineDate.tz(timeZone);
    formattedDate = `${tzDate.format("LLL")} ${tzDate.format("z")}`;
  } else {
    const utcDate = deadlineDate.utc();
    formattedDate = `${utcDate.format("LLL")} UTC`;
  }

  return formattedDate;
}

/**
 * Get hours remaining until deadline.
 */
export function getHoursRemaining(deadline: Date | null): number | null {
  if (!deadline) {
    return null;
  }

  const now = dayjs();
  const deadlineDate = dayjs(deadline);
  const hoursRemaining = deadlineDate.diff(now, "hour", true);

  return hoursRemaining < 0 ? 0 : hoursRemaining;
}

