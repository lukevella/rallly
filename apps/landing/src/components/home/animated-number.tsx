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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// Below this the ticker would fire faster than it reads as a discrete event.
const MIN_TICK_MS = 2000;

/**
 * Ticks the badge up at the average rate the 30-day count was accumulated,
 * so the number visibly moves while the page is open.
 *
 * Deliberately anchored to page load rather than to when the snapshot was
 * taken. The 30-day figure is a rolling window and so roughly stationary —
 * votes age out of the back as fast as they arrive at the front — meaning
 * projecting it forward from a cached timestamp would overstate a real
 * published statistic without bound (a week-old cache entry would add ~23%).
 * Starting from the measured value keeps first paint accurate.
 */
function useLiveCount({
  baseValue,
  enabled,
}: {
  baseValue: number;
  enabled: boolean;
}) {
  const tickMs = baseValue > 0 ? THIRTY_DAYS_MS / baseValue : 0;
  const [value, setValue] = React.useState(baseValue);

  React.useEffect(() => {
    setValue(baseValue);
    if (!enabled || tickMs <= 0) {
      return;
    }
    const interval = Math.max(tickMs, MIN_TICK_MS);
    const startedAt = Date.now();
    // Derived from the wall clock rather than incremented, so a throttled or
    // suspended timer catches up in one step instead of drifting behind.
    const id = window.setInterval(() => {
      const elapsed = Math.max(0, Date.now() - startedAt);
      setValue(baseValue + Math.floor(elapsed / interval));
    }, interval);
    return () => window.clearInterval(id);
  }, [baseValue, tickMs, enabled]);

  return value;
}

function AnimatedNumber({
  value,
  display,
  locale,
  live: liveEnabled = false,
}: {
  value: number;
  display: string;
  locale: string;
  live?: boolean;
}) {
  const [rolledUp, setRolledUp] = React.useState(false);
  const [shown, setShown] = React.useState(value);
  const [animated, setAnimated] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  const live = useLiveCount({
    baseValue: value,
    // Ticking starts only once the roll-up has landed, so the two animations
    // never fight over the same digits.
    enabled: liveEnabled && rolledUp,
  });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRolledUp(true);
      return;
    }
    let frame: number;
    let settle: number;
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
            settle = window.setTimeout(() => setRolledUp(true), DURATION_MS);
          });
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [value]);

  // Once ticking, the live value drives the display; before that the roll-up
  // owns it.
  const target = liveEnabled && rolledUp ? live : shown;
  // The sizer keeps the translation's own token unless ticking has pushed the
  // number past it, so a badge that never ticks measures exactly as before and
  // a ticking one never reflows the sentence as digits are added.
  const sizerText =
    live > value ? new Intl.NumberFormat(locale).format(live) : display;

  return (
    // tabular-nums keeps the sizer and NumberFlow (which renders digits at a
    // uniform width) measuring identically.
    <span
      ref={ref}
      role="img"
      // Stays on the value the sentence was written around: the ticking is a
      // liveness flourish, and a label that mutates every minute would be
      // churn for assistive tech without conveying anything new.
      aria-label={display}
      className="relative inline-block tabular-nums"
    >
      {/* Invisible copy of the final number holds its width for the whole
          animation so the surrounding text doesn't shift as digits roll in */}
      <span className="invisible" aria-hidden="true">
        {sizerText}
      </span>
      {/* NumberFlow's box is taller than the text (mask padding) but
          symmetric around the glyphs, so centering it on the sizer — also
          symmetric — puts both baselines in the same place */}
      <span
        className="absolute inset-0 flex items-center justify-end"
        aria-hidden="true"
      >
        <NumberFlow
          value={target}
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
  live,
  children,
}: {
  locale: string;
  icon?: React.ReactNode;
  live?: boolean;
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
              live={live}
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
  live,
  children,
}: {
  locale: string;
  live?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <AnimatedStat locale={locale} icon={<UsersIcon />} live={live}>
      {children}
    </AnimatedStat>
  );
}

export function PollsBadge({
  locale,
  live,
  children,
}: {
  locale: string;
  live?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <AnimatedStat locale={locale} icon={<BarChart2Icon />} live={live}>
      {children}
    </AnimatedStat>
  );
}
