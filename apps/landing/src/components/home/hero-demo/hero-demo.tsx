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
    <div className="relative z-10 select-none md:mx-auto md:max-w-full lg:mb-12">
      <div className="mr-[calc(50%-50vw)] overflow-hidden [mask-image:linear-gradient(to_left,transparent,black_6rem)] md:mr-0 md:overflow-visible md:[mask-image:none]">
        <div
          aria-hidden="true"
          className="w-max [zoom:0.65] md:[zoom:0.75] lg:[zoom:1]"
        >
          <DesktopDemo
            locale={locale}
            days={days}
            scores={scores}
            preset={demoPreset}
            t={t}
          />
        </div>
      </div>
      <div className="hidden lg:absolute lg:-right-6 lg:-bottom-12 lg:block lg:w-[320px]">
        <TryItPrompt
          text={t("heroDemoTryIt", {
            ns: "home",
            defaultValue: "Go ahead, try voting!",
          })}
        />
        <MobileDemo
          locale={locale}
          days={days}
          scores={scores}
          accentColor={demoPreset.space?.color}
          t={t}
        />
      </div>
    </div>
  );
};
