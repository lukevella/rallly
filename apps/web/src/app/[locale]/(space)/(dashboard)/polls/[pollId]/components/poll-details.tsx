import { ClockIcon, MapPinIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import type { PollDetails as Poll } from "@/features/poll/types";
import { getTranslation } from "@/i18n/server";
import { formatDuration } from "@/lib/datetime/format";

const factIconClassName =
  "mt-[calc((1lh-1rem)/2)] size-4 shrink-0 text-muted-foreground";

/** The event facts in a row under the title. */
export async function PollDetails({ poll }: { poll: Poll }) {
  const { t, i18n } = await getTranslation();
  const firstOption = poll.options[0];
  const sharedDuration =
    firstOption &&
    poll.options.every(
      (option) =>
        option.duration > 0 && option.duration === firstOption.duration,
    )
      ? firstOption.duration
      : null;
  const allDay =
    poll.options.length > 0 &&
    poll.options.every((option) => option.duration === 0);

  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-2 px-4 pt-2 text-muted-foreground text-sm empty:hidden">
      {sharedDuration || allDay ? (
        <div>
          <dt className="sr-only">
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="eventHeaderDuration"
              defaults="Duration"
            />
          </dt>
          <dd className="flex items-start gap-2">
            <ClockIcon aria-hidden="true" className={factIconClassName} />
            <span className="min-w-0">
              {sharedDuration ? (
                formatDuration(sharedDuration, i18n.language)
              ) : (
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="app"
                  i18nKey="allDay"
                  defaults="All day"
                />
              )}
            </span>
          </dd>
        </div>
      ) : null}
      {poll.location ? (
        <div>
          <dt className="sr-only">
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="eventHeaderLocation"
              defaults="Location"
            />
          </dt>
          <dd className="flex items-start gap-2">
            <MapPinIcon aria-hidden="true" className={factIconClassName} />
            <span className="min-w-0">
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </span>
          </dd>
        </div>
      ) : null}
      {poll.conferencing ? (
        <div>
          <dt className="sr-only">
            <Trans
              t={t}
              i18n={i18n}
              ns="app"
              i18nKey="eventHeaderVideoCall"
              defaults="Video call"
            />
          </dt>
          <dd className="flex items-start gap-2 [&>svg]:mt-[calc((1lh-1rem)/2)] [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
            <PollConferencingSummary
              conferencing={poll.conferencing}
              meetingUri={poll.event?.conferencingUri}
            />
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
