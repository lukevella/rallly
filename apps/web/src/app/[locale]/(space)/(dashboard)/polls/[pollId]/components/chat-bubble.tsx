"use client";

import { cn } from "@rallly/ui";
import React from "react";
import { useTranslation } from "@/i18n/client";

/** A note or comment as a chat bubble, clamped to three lines with a toggle. */
export function ChatBubble({
  tone = "neutral",
  children,
}: {
  /** Primary marks a participant's note; comments stay neutral. */
  tone?: "neutral" | "primary";
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [clamped, setClamped] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    // Re-measured on resize: a note clamped at one width may fit at another.
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <blockquote
      className={cn(
        "flex w-fit max-w-prose flex-col items-start gap-1 rounded-2xl rounded-tl-sm px-3 py-2",
        tone === "primary" ? "bg-primary/10" : "bg-foreground/5",
      )}
    >
      <p
        ref={ref}
        className={cn(
          "whitespace-pre-line text-pretty",
          !expanded && "line-clamp-3",
        )}
      >
        {children}
      </p>
      {clamped ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded
            ? t("showLess", { defaultValue: "Show less" })
            : t("showMore", { defaultValue: "Show more" })}
        </button>
      ) : null}
    </blockquote>
  );
}
