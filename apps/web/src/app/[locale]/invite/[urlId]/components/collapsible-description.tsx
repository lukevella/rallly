"use client";

import { posthog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import * as React from "react";
import { Trans } from "@/i18n/client";

// Matches max-h-36. Content up to one line past it is shown in full: a toggle
// that reveals a single line costs more than it saves.
const collapsedHeightRem = 9;
const slackRem = 1.75;

/**
 * Clamps a long description to a few lines with a toggle. Nothing is clamped
 * until measured: a clamp painted before hydration would hide text with no
 * way to reveal it.
 */
export function CollapsibleDescription({
  pollId,
  children,
}: {
  pollId: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  const regionRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [collapsible, setCollapsible] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    const measure = () => {
      const rem = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      setCollapsible(
        content.offsetHeight > (collapsedHeightRem + slackRem) * rem,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const collapsed = collapsible && !expanded;

  // A link hidden under the fade can still take keyboard focus, so open up
  // rather than focus something the reader cannot see.
  React.useEffect(() => {
    const region = regionRef.current;
    if (!region || !collapsed) {
      return;
    }
    const expand = () => setExpanded(true);
    region.addEventListener("focusin", expand);
    return () => region.removeEventListener("focusin", expand);
  }, [collapsed]);

  return (
    <div>
      <div
        ref={regionRef}
        id={id}
        className={cn(
          collapsed &&
            "max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]",
        )}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => {
            if (!expanded) {
              posthog?.capture("poll_vote:description_expand", {
                poll_id: pollId,
              });
            }
            setExpanded(!expanded);
          }}
          className="mt-1 text-foreground text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {expanded ? (
            <Trans i18nKey="descriptionShowLess" defaults="Show less" />
          ) : (
            <Trans i18nKey="descriptionShowMore" defaults="Show more" />
          )}
        </button>
      ) : null}
    </div>
  );
}
