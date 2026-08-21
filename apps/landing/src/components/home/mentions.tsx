import type * as React from "react";
import { FadeIn } from "@/components/home/fade-in";
import { getTranslation } from "@/i18n/server";

export function Mention({
  logo,
  delay = 0,
  children,
}: React.PropsWithChildren<{
  logo: React.ReactNode;
  delay?: number;
}>) {
  return (
    <FadeIn
      delay={delay}
      className="flex snap-start flex-col space-y-4 rounded-md"
    >
      <div className="flex items-start justify-between">{logo}</div>
      <p className="grow text-base">{children}</p>
    </FadeIn>
  );
}

export async function Mentions({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const { t } = await getTranslation<"home">(locale, "home");
  return (
    // Below xl the four mentions stay side by side and scroll horizontally,
    // bleeding past the page gutters so the next one peeks in. The column width
    // is pinned to what a mention gets in the xl grid — the page container maxes
    // out at 72rem with 1.5rem gutters, so (69rem - 3 * 2rem) / 4 = 15.75rem —
    // which keeps every quote breaking across the same lines at every width.
    // The pb/-mb pair gives the mentions' fade-in-up room to land inside the
    // scroll port, which would otherwise show a vertical scrollbar for it.
    // A named, focusable section so the mentions that start off screen can be
    // scrolled to by keyboard: none of them contain a focusable element, so
    // without this the strip is unreachable outside of Chromium's own
    // keyboard-focusable scrollers.
    <section
      aria-label={t("mentionsLabel", {
        ns: "home",
        defaultValue: "Press mentions",
      })}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll port needs to be focusable to be scrollable by keyboard
      tabIndex={0}
      className="-mx-4 -mb-5 grid snap-x snap-mandatory scroll-px-4 grid-cols-[repeat(4,15.75rem)] gap-4 overflow-x-auto overflow-y-hidden px-4 pb-5 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:gap-8 xl:mx-0 xl:mb-0 xl:grid-cols-4 xl:overflow-visible xl:px-0 xl:pb-0"
    >
      {children}
    </section>
  );
}
