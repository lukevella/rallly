import { getTranslation } from "@/i18n/server";
import { getDemoDays, getScores } from "./demo-data";
import { DesktopDemo } from "./desktop-demo";
import { MobileDemo } from "./mobile-demo";

// A presentational replica of the poll screens, deliberately decoupled from
// apps/web so the landing page can't be broken by app changes. Dates are
// computed at render time and cached with the page (cacheLife on the pages
// that use this), so they refresh with the page cache instead of going stale
// like a screenshot.
export const HeroDemo = async ({ locale }: { locale: string }) => {
  const { t } = await getTranslation<"home">(locale, "home");
  const days = getDemoDays(new Date());
  const scores = getScores(days);

  return (
    <div className="relative z-10 mx-auto mb-12 w-fit max-w-full" aria-hidden>
      <DesktopDemo locale={locale} days={days} scores={scores} t={t} />
      <div className="absolute -right-6 -bottom-12 hidden w-[280px] lg:block">
        <MobileDemo locale={locale} days={days} t={t} />
      </div>
    </div>
  );
};
