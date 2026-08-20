export type DemoVote = "yes" | "ifNeedBe" | "no";

export type DemoOption = {
  start: Date;
  end: Date;
};

export type DemoDay = {
  date: Date;
  options: DemoOption[];
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SLOT_HOURS = [12, 18];

// The first Thursday at least a week out, as a plain YYYY-MM-DD string. This is
// the only thing about the demo that depends on the current time, so it is the
// cache key for the rendered demo: everything below is a pure function of it.
// Keying on the value rather than on a duration means the HTML and the RSC
// payload can never be generated on opposite sides of a rollover, which would
// otherwise surface as a hydration mismatch.
export function getDemoAnchor(now: Date) {
  let day = new Date(now.getTime() + 7 * DAY_MS);
  while (day.getUTCDay() !== 4) {
    day = new Date(day.getTime() + DAY_MS);
  }
  return day.toISOString().slice(0, 10);
}

// The demo dates are floating wall times constructed in UTC and always
// formatted with timeZone: "UTC", so the rendered clock times don't depend
// on the server's time zone.
export function getDemoDays(anchor: string): DemoDay[] {
  const [year, month, day] = anchor.split("-").map(Number);
  const firstThursday = Date.UTC(year, month - 1, day);
  return [0, 1, 2, 3].map((week) => {
    const midnight = firstThursday + week * 7 * DAY_MS;
    return {
      date: new Date(midnight),
      options: SLOT_HOURS.map((hour) => ({
        start: new Date(midnight + hour * HOUR_MS),
        end: new Date(midnight + (hour + 1) * HOUR_MS),
      })),
    };
  });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

// The count badge in the app includes both yes and if-need-be votes.
export function getScores(
  days: DemoDay[],
  participants: { votes: DemoVote[] }[],
) {
  const optionCount = days.reduce((sum, day) => sum + day.options.length, 0);
  return Array.from({ length: optionCount }, (_, index) =>
    participants.reduce(
      (score, participant) =>
        participant.votes[index] === "no" ? score : score + 1,
      0,
    ),
  );
}

export function formatDemoParts(locale: string) {
  const utc = { timeZone: "UTC" } as const;
  return {
    month: new Intl.DateTimeFormat(locale, { ...utc, month: "short" }),
    year: new Intl.DateTimeFormat(locale, { ...utc, year: "numeric" }),
    weekday: new Intl.DateTimeFormat(locale, { ...utc, weekday: "short" }),
    dayOfMonth: new Intl.DateTimeFormat(locale, { ...utc, day: "numeric" }),
    fullDay: new Intl.DateTimeFormat(locale, {
      ...utc,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: new Intl.DateTimeFormat(locale, {
      ...utc,
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}
