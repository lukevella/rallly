"use client";

import NumberFlow from "@number-flow/react";
import { BarChart2Icon, UsersIcon } from "lucide-react";
import * as React from "react";

const DURATION_MS = 1200;

// Locates the first localized integer (any Unicode numbering system, with
// locale grouping separators) so the surrounding translation stays untouched.
function parseLocalizedInteger(text: string, locale: string) {
  const digitFor = new Map<string, number>();
  const plainFormat = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let digit = 0; digit <= 9; digit++) {
    digitFor.set(plainFormat.format(digit), digit);
  }
  const separators = new Intl.NumberFormat(locale)
    .formatToParts(1234567)
    .filter((part) => part.type === "group")
    .map((part) => part.value)
    .join("");
  const digits = [...digitFor.keys()].join("");
  const pattern = new RegExp(
    `[${digits}](?:[${digits}${separators}.,\\s\\u00A0\\u202F]*[${digits}])?`,
    "u",
  );
  const match = pattern.exec(text);
  if (!match) {
    return null;
  }
  const token = match[0];
  let value = 0;
  for (const char of token) {
    const digit = digitFor.get(char);
    if (digit !== undefined) {
      value = value * 10 + digit;
    }
  }
  return { value, token, start: match.index };
}

function AnimatedNumber({
  value,
  display,
  locale,
}: {
  value: number;
  display: string;
  locale: string;
}) {
  const [shown, setShown] = React.useState(value);
  const [animated, setAnimated] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        observer.disconnect();
        // Two committed renders: drop to 0 without animation, then roll up.
        setShown(0);
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            setAnimated(true);
            setShown(value);
          });
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    // tabular-nums keeps the sizer and NumberFlow (which renders digits at a
    // uniform width) measuring identically.
    <span
      ref={ref}
      role="img"
      aria-label={display}
      className="relative inline-block tabular-nums"
    >
      {/* Invisible copy of the final number holds its width for the whole
          animation so the surrounding text doesn't shift as digits roll in */}
      <span className="invisible" aria-hidden="true">
        {display}
      </span>
      {/* NumberFlow's box is taller than the text (mask padding) but
          symmetric around the glyphs, so centering it on the sizer — also
          symmetric — puts both baselines in the same place */}
      <span
        className="absolute inset-0 flex items-center justify-end"
        aria-hidden="true"
      >
        <NumberFlow
          value={shown}
          locales={locale}
          animated={animated}
          // Layout snaps instantly so digits spin straight vertically in
          // place instead of sliding sideways while the width grows.
          transformTiming={{ duration: 0 }}
          spinTiming={{
            duration: DURATION_MS,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </span>
    </span>
  );
}

function AnimatedStat({
  locale,
  icon,
  children,
}: {
  locale: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const text = React.Children.toArray(children)
    .filter((child): child is string => typeof child === "string")
    .join("");
  const parsed = parseLocalizedInteger(text, locale);
  return (
    // items-baseline makes the text span carry the container's baseline, so
    // the badge text sits on the surrounding sentence's baseline; the icon
    // opts back into optical centering with self-center.
    // leading-none keeps the badge shorter than the paragraph's loose line
    // boxes, so wrapped lines show a gap between stacked badges.
    <strong className="inline-flex items-baseline gap-x-1.5 whitespace-nowrap rounded-lg bg-gray-200 px-3 py-1.5 font-normal text-gray-800 leading-none [&_svg]:-ml-1 [&_svg]:size-[1em] [&_svg]:shrink-0 [&_svg]:self-center">
      {icon}
      {/* Inner span keeps the number and its unit in normal inline flow so
          the space between them survives the flex container */}
      <span>
        {parsed ? (
          <>
            {text.slice(0, parsed.start)}
            <AnimatedNumber
              value={parsed.value}
              display={parsed.token}
              locale={locale}
            />
            {text.slice(parsed.start + parsed.token.length)}
          </>
        ) : (
          children
        )}
      </span>
    </strong>
  );
}

export function PeopleBadge({
  locale,
  children,
}: {
  locale: string;
  children?: React.ReactNode;
}) {
  return (
    <AnimatedStat locale={locale} icon={<UsersIcon />}>
      {children}
    </AnimatedStat>
  );
}

export function PollsBadge({
  locale,
  children,
}: {
  locale: string;
  children?: React.ReactNode;
}) {
  return (
    <AnimatedStat locale={locale} icon={<BarChart2Icon />}>
      {children}
    </AnimatedStat>
  );
}
