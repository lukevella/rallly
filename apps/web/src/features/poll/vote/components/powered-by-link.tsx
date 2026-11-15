"use client";
import { posthog } from "@rallly/posthog/client";
import { Link } from "@/components/link";
import LogoWordmark from "@/features/branding/assets/logo.svg";
import { DEFAULT_APP_NAME } from "@/features/branding/constants";
import { Trans } from "@/i18n/client";

/** The attribution pill. Client only because the click is tracked. */
export function PoweredByLink({
  pollId,
  spaceId,
  plain = false,
}: {
  pollId: string;
  spaceId: string | null;
  /** A text link among other small print, rather than the pill. */
  plain?: boolean;
}) {
  return (
    <Link
      className={
        plain
          ? "inline-flex h-6 items-center text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
          : "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-4 font-normal text-foreground text-xs shadow-xs transition-[background-color,transform] ease-out hover:bg-gray-50 active:scale-[.98] motion-reduce:active:scale-100 dark:bg-muted dark:hover:bg-[color-mix(in_oklab,var(--color-gray-800),var(--color-gray-700)_25%)]"
      }
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
      {plain ? (
        <Trans i18nKey="poweredByRalllyCo" defaults="Powered by rallly.co" />
      ) : (
        <>
          <Trans i18nKey="poweredBy" defaults="Powered by" />
          <LogoWordmark aria-hidden="true" className="h-3.5 w-auto" />
          <span className="sr-only"> {DEFAULT_APP_NAME}</span>
        </>
      )}
    </Link>
  );
}
