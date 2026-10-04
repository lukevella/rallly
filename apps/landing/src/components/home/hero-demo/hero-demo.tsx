import { cacheLife } from "next/cache";
import { getTranslation } from "@/i18n/server";
import { getDemoAnchor, getDemoDays, getScores } from "./demo-data";
import type { DemoPresetName } from "./demo-presets";
import { getDemoPreset } from "./demo-presets";
import { DesktopDemo } from "./desktop-demo";
import { MobileDemo } from "./mobile-demo";
import { TryItPrompt } from "./try-it-prompt";

// A presentational replica of the poll screens, deliberately decoupled from
// apps/web so the landing page can't be broken by app changes.
//
// The dates are derived from an anchor — the first Thursday at least a week
// out — and the whole demo is a pure function of it. Deriving the anchor first
// and passing it in as the cache key is what keeps hydration deterministic:
// the HTML and the RSC payload are produced from the same key, so they cannot
// be generated on opposite sides of the weekly rollover and disagree. Revalidating
// hourly keeps the rendered dates from trailing the rollover for long.
export const HeroDemo = async ({
  locale,
  preset = "default",
}: {
  locale: string;
  preset?: DemoPresetName;
}) => {
  "use cache";
  cacheLife("hours");
  return (
    <CachedDemo
      locale={locale}
      preset={preset}
      anchor={getDemoAnchor(new Date())}
    />
  );
};

const CachedDemo = async ({
  locale,
  preset,
  anchor,
}: {
  locale: string;
  preset: DemoPresetName;
  anchor: string;
}) => {
  "use cache";
  const { t } = await getTranslation<"home">(locale, "home");
  const demoPreset = getDemoPreset(t, preset);
  const days = getDemoDays(anchor, demoPreset.spacing);
  const scores = getScores(days, demoPreset.participants);

  return (
    <div className="relative z-10 flex select-none justify-end lg:block">
      {/* Below lg the whole composition is laid out at a fixed desktop width
          and scaled down. It is right aligned to the container, so the
          browser window overflows the viewport on the left while the phone
          stays in view. */}
      <div className="relative mb-12 w-[1060px] shrink-0 [zoom:0.6] lg:w-auto md:[zoom:0.75] lg:[zoom:1]">
        <div aria-hidden="true">
          <DesktopDemo
            locale={locale}
            days={days}
            scores={scores}
            preset={demoPreset}
            t={t}
          />
        </div>
        {/* Inset from the window's right edge by a share of its width, so the
            gap between the two right edges scales with the layout and never
            closes. */}
        <div className="absolute right-[4%] -bottom-12 w-[320px]">
          <TryItPrompt
            text={t("heroDemoTryIt", {
              ns: "home",
              defaultValue: "Go ahead, try voting!",
            })}
          />
          <MobileDemo locale={locale} days={days} scores={scores} t={t} />
        </div>
      </div>
    </div>
  );
};
