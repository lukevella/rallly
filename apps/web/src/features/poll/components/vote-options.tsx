"use client";
import * as React from "react";
import { usePoll } from "@/features/poll/client";
import VoteIcon from "@/features/poll/components/vote-icon";
import { Trans } from "@/i18n/client";

function VoteOption({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <dt>{icon}</dt>
      <dd>{label}</dd>
    </div>
  );
}

/** The available vote types as a stacked legend, for a narrow sidebar. */
export function VoteOptions() {
  const poll = usePoll();
  const headingId = React.useId();

  return (
    <div>
      <h2 id={headingId} className="mb-1.5 text-muted-foreground text-xs">
        <Trans i18nKey="responseOptions" defaults="Response options" />
      </h2>
      <dl aria-labelledby={headingId} className="flex flex-col gap-2 text-xs">
        <VoteOption
          icon={<VoteIcon type="yes" />}
          label={<Trans i18nKey="yes" defaults="Yes" />}
        />
        {poll.allowTentativeVotes ? (
          <VoteOption
            icon={<VoteIcon type="ifNeedBe" />}
            label={<Trans i18nKey="ifNeedBe" defaults="If need be" />}
          />
        ) : null}
        <VoteOption
          icon={<VoteIcon type="no" />}
          label={<Trans i18nKey="no" defaults="No" />}
        />
      </dl>
    </div>
  );
}
