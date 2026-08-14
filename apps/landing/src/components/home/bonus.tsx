import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";
import { getMonthlyPollCount, getMonthlyVoterCount } from "@/lib/data";

export async function Bonus(props: { locale: string }) {
  const [pollCount, voterCount] = await Promise.all([
    getMonthlyPollCount(),
    getMonthlyVoterCount(),
  ]);
  const { t } = await getTranslation(props.locale, ["home"]);

  return (
    <p className="mx-auto max-w-2xl text-balance text-center text-gray-600 text-lg">
      <Trans
        t={t}
        ns="home"
        i18nKey="statsLast30Days"
        defaults="<b>{voterCount, number} people</b> voted on <b>{pollCount, number} polls</b> in the last 30 days"
        values={{ voterCount, pollCount }}
        components={{
          b: <strong className="font-semibold text-gray-800" />,
        }}
      />
    </p>
  );
}

export default Bonus;
