"use client";

// beui.dev/components/motion/number

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { EASE_OUT } from "./ease";
import { cn } from "./lib/utils";

export interface NumberTickerProps {
  value: number;
  /** Digits to pad to (left). */
  pad?: number;
  /** Per-digit roll duration in seconds. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  /** Add a small blur during digit rolls. */
  blur?: boolean;
  className?: string;
  digitClassName?: string;
  /** Custom formatter, e.g. for group separators. */
  format?: (value: number) => string;
  /**
   * Announce each new value politely. Off by default: a ticker that counts up
   * as decoration would otherwise interrupt a screen reader on every frame.
   * Turn it on where the number is the thing the user is changing.
   */
  announceChanges?: boolean;
}

// One em per digit cell, so each cell is exactly the glyph's em box and the
// roll steps by whole ems.
const DIGIT_HEIGHT_EM = 1;
// A digit column is `overflow: hidden`, so it exports no glyph baseline of its
// own: the browser synthesises one from its bottom margin edge, which sits a
// half-leading below where the digits actually rest. Dropping the box by that
// half-leading puts the synthesised baseline back on the real one, so the
// number sits on the baseline of the text beside it. For a 1em box the
// half-leading is (ascent + descent - 1) / 2 — 0.125em for the metrics of the
// sans stack this ships with.
const BASELINE_SHIFT_EM = 0.125;
const DIGITS = Array.from({ length: 10 }, (_, n) => n);

export function NumberTicker({
  value,
  pad,
  duration = 0.9,
  prefix,
  suffix,
  blur = false,
  className,
  digitClassName,
  format,
  announceChanges = false,
}: NumberTickerProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const text = useMemo(() => {
    const rounded = Math.round(value);
    const formatted = format ? format(rounded) : String(rounded);
    return pad ? formatted.padStart(pad, "0") : formatted;
  }, [value, pad, format]);
  const glyphs = useMemo(() => {
    const chars = text.split("");
    // Key by place value (position from the right): a changing digit keeps its
    // identity and rolls to the new value instead of remounting and replaying
    // from 0. Growing numbers add glyphs on the left without re-keying the
    // ones, tens, hundreds already on screen.
    return chars.map((char, i) => ({ char, id: `g-${chars.length - 1 - i}` }));
  }, [text]);
  const readableText = `${prefix ?? ""}${text}${suffix ?? ""}`;

  return (
    <span
      ref={containerRef}
      // Plain inline boxes, not flex: a flex container centres its items and
      // ignores vertical-align, which would override the baseline shift the
      // digit columns rely on.
      className={cn("inline tabular-nums", className)}
    >
      <span
        className="sr-only"
        aria-live={announceChanges ? "polite" : undefined}
        aria-atomic={announceChanges ? "true" : undefined}
      >
        {readableText}
      </span>
      <span aria-hidden="true" className="inline">
        {prefix ? <span>{prefix}</span> : null}
        {glyphs.map(({ char, id }) => {
          const isDigit = /\d/.test(char);
          if (!isDigit) {
            return (
              <span key={id} className="inline-block">
                {char}
              </span>
            );
          }
          const digit = Number(char);
          return (
            <Digit
              key={id}
              digit={digit}
              duration={duration}
              blur={blur}
              className={digitClassName}
            />
          );
        })}
        {suffix ? <span>{suffix}</span> : null}
      </span>
    </span>
  );
}

function Digit({
  digit,
  duration,
  blur,
  className,
}: {
  digit: number;
  duration: number;
  blur: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const columnRef = useRef<HTMLSpanElement>(null);
  // Seeded with the first digit so the blur only accompanies a roll. Firing it
  // on mount would blur the number in, which is the entrance animation the
  // resting-value render exists to avoid.
  const previousDigit = useRef(digit);

  useEffect(() => {
    const rolled = previousDigit.current !== digit;
    previousDigit.current = digit;
    if (
      !rolled ||
      reduce ||
      !blur ||
      !columnRef.current ||
      !Number.isFinite(digit)
    ) {
      return;
    }

    const node = columnRef.current;
    const controls = animate(
      node,
      { filter: ["blur(10px)", "blur(0px)"] },
      {
        duration: Math.min(duration * 0.75, 0.32),
        ease: EASE_OUT,
      },
    );

    return () => {
      controls.stop();
      node.style.filter = "blur(0px)";
    };
  }, [blur, digit, duration, reduce]);

  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      style={{
        height: `${DIGIT_HEIGHT_EM}em`,
        width: "1ch",
        verticalAlign: `-${BASELINE_SHIFT_EM}em`,
      }}
    >
      <motion.span
        ref={columnRef}
        // Render at the resting position instead of animating in: the number
        // is the content, so it should be correct on first paint (server
        // rendering included) rather than counting up to itself. Later value
        // changes still roll, which is the whole point of the component.
        initial={false}
        animate={{ y: `-${digit * DIGIT_HEIGHT_EM}em` }}
        transition={reduce ? { duration: 0 } : { duration, ease: EASE_OUT }}
        className="absolute inset-x-0 top-0 flex flex-col items-center will-change-[transform,filter]"
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            className="block text-center leading-[1em]"
            style={{ height: `${DIGIT_HEIGHT_EM}em` }}
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
