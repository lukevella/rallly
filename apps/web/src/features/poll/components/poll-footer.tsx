"use client";
import { posthog } from "@rallly/posthog/client";
import { InstanceFooterLinks } from "@/components/instance-footer-links";
import { Link } from "@/components/link";
import { useBranding } from "@/features/branding/client";
import { DEFAULT_APP_NAME } from "@/features/branding/constants";
import { usePoll } from "@/features/poll/client";
import { Trans } from "@/i18n/client";

/**
 * Footer for the participant-facing poll surfaces: the invite page, and the
 * admin page which previews it.
 *
 * Attribution and footer links are independent. Attribution can be hidden per
 * instance or per space; the instance's footer links carry legal disclosures
 * and are shown regardless.
 */
export function PollFooter({
  footerLinks = [],
}: {
  footerLinks?: { label: string; href: string }[];
}) {
  const { hideAttribution } = useBranding();
  const poll = usePoll();

  const isAttributionHidden = hideAttribution || poll.space?.hideAttribution;

  if (isAttributionHidden && footerLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center text-muted-foreground text-sm">
      <InstanceFooterLinks links={footerLinks} />
      {isAttributionHidden ? null : (
        <Link
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-muted px-4 font-medium text-foreground text-sm shadow-xs transition-[background-color,transform] ease-out hover:bg-muted-border active:scale-[.98] motion-reduce:active:scale-100"
          href="https://rallly.co?utm_source=rallly&utm_medium=poll&utm_campaign=powered_by"
          onClick={() => {
            posthog?.capture("poll_footer:powered_by_link_click", {
              pollId: poll.id,
              spaceId: poll.spaceId,
              tier: poll.space?.tier,
              $groups: {
                poll: poll.id,
                ...(poll.spaceId ? { space: poll.spaceId } : {}),
              },
            });
          }}
        >
          <Trans i18nKey="poweredBy" defaults="Powered by" />
          {/* The wordmark is masked so it inherits the pill's text color in both themes */}
          <span
            aria-hidden="true"
            className="h-3.5 w-[75px] bg-foreground [mask:url(/static/logo.svg)_no-repeat_center/contain]"
          />
          <span className="sr-only"> {DEFAULT_APP_NAME}</span>
        </Link>
      )}
    </div>
  );
}
