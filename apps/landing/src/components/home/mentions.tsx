import type * as React from "react";
import { FadeIn } from "@/components/home/fade-in";

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

export function Mentions({ children }: { children: React.ReactNode }) {
  // Below md the four mentions stay side by side and scroll horizontally,
  // bleeding past the page gutters so the next one peeks in. The bottom
  // padding leaves room for the mentions' fade-in offset, which would
  // otherwise make the scroller overflow vertically as it animates.
  return (
    <div className="-mx-4 grid snap-x snap-mandatory grid-cols-[repeat(4,min(75vw,20rem))] gap-8 overflow-x-auto scroll-px-4 px-4 pb-5 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid-cols-4 md:overflow-x-visible md:px-0 md:pb-0">
      {children}
    </div>
  );
}
