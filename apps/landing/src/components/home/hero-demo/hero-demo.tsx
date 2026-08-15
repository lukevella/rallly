import { getTranslation } from "@/i18n/server";
import { formatDemoParts, getDemoDays, getScores } from "./demo-data";
import { DesktopDemo } from "./desktop-demo";
import { MobileDemo } from "./mobile-demo";

// A presentational replica of the poll screens, deliberately decoupled from
// apps/web so the landing page can't be broken by app changes. Dates are
// computed at render time and cached with the page (cacheLife on the pages
// that use this), so they refresh with the page cache instead of going stale
// like a screenshot.
//
// The desktop shot is decoration (aria-hidden, no interactive elements); the
// phone is a working demo, so date and time strings are pre-formatted here on
// the server and passed down as plain props — client-side Intl could disagree
// with the server and cause hydration mismatches.
export const HeroDemo = async ({ locale }: { locale: string }) => {
  const { t } = await getTranslation<"home">(locale, "home");
  const days = getDemoDays(new Date());
  const scores = getScores(days);
  const format = formatDemoParts(locale);

  let optionIndex = -1;
  const mobileDays = days.slice(0, 3).map((day) => ({
    label: format.fullDay.format(day.date),
    options: day.options.map((option) => {
      optionIndex += 1;
      return {
        id: option.start.toISOString(),
        time: format.time.formatRange(option.start, option.end),
        score: scores[optionIndex],
      };
    }),
  }));

  return (
    <div className="relative z-10 mx-auto mb-12 w-fit max-w-full">
      <div aria-hidden="true" className="hidden lg:block">
        <DesktopDemo locale={locale} days={days} scores={scores} t={t} />
      </div>
      <div className="mx-auto w-[280px] lg:absolute lg:-right-6 lg:-bottom-12 lg:mx-0">
        <MobileDemo days={mobileDays} />
      </div>
    </div>
  );
};
