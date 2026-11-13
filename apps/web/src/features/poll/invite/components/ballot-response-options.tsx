"use client";

import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import { Trans, useTranslation } from "@/i18n/client";

/** The answers a viewer can give, each with the mark it shows on a row. */
export function BallotResponseOptions({
  allowTentativeVotes,
}: {
  allowTentativeVotes: boolean;
}) {
  const { t } = useTranslation();
  const headingId = React.useId();
  const options = [
    { type: "yes" as const, label: t("yes", { defaultValue: "Yes" }) },
    ...(allowTentativeVotes
      ? [
          {
            type: "ifNeedBe" as const,
            label: t("ifNeedBe", { defaultValue: "If need be" }),
          },
        ]
      : []),
    { type: "no" as const, label: t("no", { defaultValue: "No" }) },
  ];

  return (
    <div>
      {/* Below lg the key is one row, so the options start higher up the page. */}
      <h2
        id={headingId}
        className="font-normal text-muted-foreground text-sm max-lg:sr-only"
      >
        <Trans i18nKey="responseOptions" defaults="Response options" />
      </h2>
      <ul
        aria-labelledby={headingId}
        className="flex gap-x-4 gap-y-1.5 text-sm max-lg:flex-wrap lg:mt-1 lg:flex-col"
      >
        {options.map(({ type, label }) => (
          <li key={type} className="flex items-center gap-2">
            <span aria-hidden="true" className="flex">
              <VoteIcon round type={type} className="size-4" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
