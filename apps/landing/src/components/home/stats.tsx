import { Trans } from "react-i18next/TransWithoutContext";
import { AnimatedStat } from "@/components/home/animated-number";
import { getTranslation } from "@/i18n/server";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

export async function Stats({ locale }: { locale: string }) {
  const [pollCount, voterCount] = await Promise.all([
    getMonthlyPollCount(),
    getMonthlyVoterCount(),
  ]);
  const { t } = await getTranslation(locale, ["home"]);

  return (
    <section className="py-8 sm:py-16">
      <p className="mx-auto max-w-2xl text-balance text-center text-2xl text-gray-600">
        <Trans
          t={t}
          ns="home"
          i18nKey="statsLast30Days"
          defaults="<b>{voterCount, plural, one {# person} other {# people}}</b> voted on <b>{pollCount, plural, one {# poll} other {# polls}}</b> in the last 30 days"
          values={{ voterCount, pollCount }}
          components={{
            b: <AnimatedStat locale={locale} />,
          }}
        />
      </p>
    </section>
  );
}
