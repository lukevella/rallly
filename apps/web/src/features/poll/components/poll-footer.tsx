"use client";
import { posthog } from "@rallly/posthog/client";
import Link from "next/link";
import { InstanceFooterLinks } from "@/components/instance-footer-links";
import { useBranding } from "@/features/branding/client";
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
    <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground text-sm">
      <InstanceFooterLinks links={footerLinks} />
      {isAttributionHidden ? null : (
        <Trans
          defaults="Powered by <a>{name}</a>"
          i18nKey="poweredByRallly"
          values={{ name: "rallly.co" }}
          components={{
            a: (
              <Link
                prefetch={false}
                className="rounded-none border-b border-b-gray-500 font-semibold hover:text-primary"
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
              />
            ),
          }}
        />
      )}
    </div>
  );
}
