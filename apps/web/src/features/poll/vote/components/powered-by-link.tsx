"use client";
import { posthog } from "@rallly/posthog/client";
import { Link } from "@/components/link";
import { DEFAULT_APP_NAME } from "@/features/branding/constants";
import { Trans } from "@/i18n/client";

const LOGO_MASK = "url(/static/logo.svg) center / contain no-repeat";

/** The attribution pill. Client only because the click is tracked. */
export function PoweredByLink({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: string | null;
}) {
  return (
    <Link
      className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-4 font-normal text-foreground text-xs shadow-xs transition-[background-color,transform] ease-out hover:bg-gray-50 active:scale-[.98] motion-reduce:active:scale-100 dark:bg-muted dark:hover:bg-[color-mix(in_oklab,var(--color-gray-800),var(--color-gray-700)_25%)]"
      href="https://rallly.co?utm_source=rallly&utm_medium=poll&utm_campaign=powered_by"
      onClick={() => {
        posthog?.capture("poll_footer:powered_by_link_click", {
          pollId,
          spaceId,
          $groups: {
            poll: pollId,
            ...(spaceId ? { space: spaceId } : {}),
          },
        });
      }}
    >
      <Trans i18nKey="poweredBy" defaults="Powered by" />
      {/* The wordmark is masked so it inherits the pill's text color in both
          themes. The mask sits in an inline style because a url() in the
          stylesheet resolves against the asset host, not this page's origin. */}
      <span
        aria-hidden="true"
        className="h-3.5 w-[75px] bg-foreground"
        style={{ mask: LOGO_MASK, WebkitMask: LOGO_MASK }}
      />
      <span className="sr-only"> {DEFAULT_APP_NAME}</span>
    </Link>
  );
}
