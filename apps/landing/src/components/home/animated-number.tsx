"use client";

import NumberFlow from "@number-flow/react";
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
    <span ref={ref} role="img" aria-label={display}>
      <span aria-hidden="true">
        <NumberFlow
          value={shown}
          locales={locale}
          animated={animated}
          spinTiming={{
            duration: DURATION_MS,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </span>
    </span>
  );
}

export function AnimatedStat({
  locale,
  children,
}: {
  locale: string;
  children?: React.ReactNode;
}) {
  const text = React.Children.toArray(children)
    .filter((child): child is string => typeof child === "string")
    .join("");
  const parsed = parseLocalizedInteger(text, locale);
  return (
    <strong className="font-medium text-gray-800">
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
    </strong>
  );
}
