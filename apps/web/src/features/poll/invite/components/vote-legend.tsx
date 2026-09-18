import { VoteIcon } from "@rallly/ui/vote-icon";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

/** The available vote types as a stacked legend, for a narrow sidebar. */
export async function VoteLegend({
  allowTentativeVotes,
}: {
  allowTentativeVotes: boolean;
}) {
  const { t, i18n } = await getTranslation();
  const headingId = "vote-legend-heading";

  const types = [
    { type: "yes" as const, key: "yes", label: "Yes" },
    ...(allowTentativeVotes
      ? [{ type: "ifNeedBe" as const, key: "ifNeedBe", label: "If need be" }]
      : []),
    { type: "no" as const, key: "no", label: "No" },
  ];

  return (
    <div>
      <h2 id={headingId} className="mb-1.5 text-muted-foreground text-xs">
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="responseOptions"
          defaults="Response options"
        />
      </h2>
      <dl aria-labelledby={headingId} className="flex flex-col gap-2 text-xs">
        {types.map(({ type, key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <dt>
              <VoteIcon type={type} title={t(key, { defaultValue: label })} />
            </dt>
            <dd>{t(key, { defaultValue: label })}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
