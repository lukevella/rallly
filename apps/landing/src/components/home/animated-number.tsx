"use client";

import NumberFlow from "@number-flow/react";
import { BarChart2Icon, UsersIcon } from "lucide-react";
import * as React from "react";

const DURATION_MS = 1200;
// Logarithmic spin: log10(1 + 9t) sampled into a CSS linear() easing.
//
// The obvious "decelerating" curves (expo-out and friends) put ~97% of the
// count in the first half of the duration, so the digits snap to nearly the
// final value and then sit still through a long dead tail. A log curve keeps
// them visibly climbing for the whole spin — quick off the mark, easing down,
// but still moving at t=0.9 — which is what reads as counting up rather than
// landing. Falls back to constant-rate easing below Safari 17.2.
const LOG_EASING =
  "linear(0, 0.1383, 0.243, 0.3274, 0.3979, 0.4586, 0.5119, 0.5593, 0.6021, 0.641, 0.6767, 0.7097, 0.7404, 0.769, 0.7959, 0.8212, 0.8451, 0.8678, 0.8893, 0.9098, 0.9294, 0.9482, 0.9661, 0.9834, 1)";

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
// Keeps a burst from firing faster than a digit roll can settle.
const MIN_GAP_MS = 700;
// Stops a long random gap from reading as "the ticker died". Relative to the
// mean so a slow badge keeps its shape instead of being squashed against a
// fixed ceiling, with an absolute backstop for very slow ones.
const MAX_GAP_FACTOR = 2.5;
const MAX_GAP_MS = 25000;

/**
 * Random gap around a mean, drawn from an exponential distribution.
 *
 * Votes arrive independently of each other, which makes arrivals a Poisson
 * process and the gaps between them exponential — so sampling this way makes
 * the badge cluster and pause the way real traffic does, instead of ticking
 * like a metronome. The clamps trade a little of that shape for the two
 * things a uniform timer got for free: no burst too fast to read, no gap long
 * enough to look broken.
 */
function nextGapMs(meanMs: number) {
  const gap = -Math.log(1 - Math.random()) * meanMs;
  const ceiling = Math.min(meanMs * MAX_GAP_FACTOR, MAX_GAP_MS);
  return Math.min(Math.max(gap, MIN_GAP_MS), Math.max(ceiling, MIN_GAP_MS));
}

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
    const startedAt = Date.now();
    let timeout: number;
    // The displayed count is always derived from elapsed wall-clock time, so
    // the jitter only decides *when* to look — it never feeds back into the
    // arithmetic. That keeps the average exactly the measured rate however
    // the gaps fall, and lets a throttled or suspended timer catch up in one
    // step instead of drifting behind.
    const sample = () => {
      const elapsed = Math.max(0, Date.now() - startedAt);
      setValue(baseValue + Math.floor(elapsed / tickMs));
    };
    const schedule = () => {
      timeout = window.setTimeout(() => {
        sample();
        schedule();
      }, nextGapMs(tickMs));
    };
    schedule();

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      // Resync on return so a backgrounded tab shows the right number
      // immediately rather than waiting out a stale timer.
      window.clearTimeout(timeout);
      sample();
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
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
            easing: LOG_EASING,
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
