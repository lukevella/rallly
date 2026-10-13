"use client";

import { cn } from "@rallly/ui";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type * as React from "react";

export type VoteIconType = "yes" | "ifNeedBe" | "no" | "pending";

const voteIconVariants = cva("transition-[color] duration-200 ease-out-ui", {
  variants: {
    size: {
      sm: "size-3",
      md: "size-5",
    },
    type: {
      yes: "text-green-500",
      ifNeedBe: "text-amber-400",
      no: "text-gray-500",
      pending: "text-gray-400 dark:text-gray-500",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type VoteIconProps = {
  type?: VoteIconType;
  /**
   * Accessible label. Omit to render the icon as decorative (aria-hidden),
   * which is correct when adjacent text already names the vote.
   */
  title?: string;
  className?: string;
} & Omit<VariantProps<typeof voteIconVariants>, "type">;

/**
 * Glyph paths, drawn small in a 20x20 box and scaled up about the centre to
 * sit inside their container.
 */
type VoteIconChoice = Exclude<VoteIconType, "pending">;

const glyphs: Record<VoteIconType, { d: string }> = {
  pending: {
    d: "M8 9H12C12.552 9 13 9.448 13 10C13 10.552 12.552 11 12 11H8C7.448 11 7 10.552 7 10C7 9.448 7.448 9 8 9Z",
  },
  yes: {
    d: "M13.707 8.707C13.8892 8.5184 13.99 8.2658 13.9877 8.0036C13.9854 7.7414 13.8802 7.49059 13.6948 7.30518C13.5094 7.11977 13.2586 7.0146 12.9964 7.01233C12.7342 7.01005 12.4816 7.11084 12.293 7.293L9 10.586L7.707 9.293C7.5184 9.11084 7.2658 9.01005 7.0036 9.01233C6.7414 9.0146 6.49059 9.11977 6.30518 9.30518C6.11977 9.49059 6.0146 9.7414 6.01233 10.0036C6.01005 10.2658 6.11084 10.5184 6.293 10.707L8.293 12.707C8.48053 12.8945 8.73484 12.9998 9 12.9998C9.26516 12.9998 9.51947 12.8945 9.707 12.707L13.707 8.707Z",
  },
  ifNeedBe: {
    d: "M13.106 10.447C12.796 9.827 12.52 9.433 12.293 9.207C12.116 9.03 12.02 9.004 12 9C11.98 9.004 11.884 9.03 11.707 9.207C11.481 9.433 11.204 9.827 10.895 10.447C10.538 11.161 10.148 11.767 9.707 12.207C9.265 12.65 8.692 13 8 13C7.308 13 6.735 12.65 6.293 12.207C5.853 11.767 5.463 11.161 5.106 10.447C5.04609 10.3294 5.01004 10.2011 4.99995 10.0695C4.98985 9.93793 5.0059 9.80564 5.04718 9.68029C5.08845 9.55493 5.15413 9.43898 5.24043 9.33913C5.32673 9.23928 5.43194 9.1575 5.55 9.0985C5.66806 9.0395 5.79663 9.00446 5.92829 8.99539C6.05996 8.98632 6.19212 9.0034 6.31715 9.04566C6.44218 9.08791 6.55761 9.15449 6.65679 9.24156C6.75597 9.32864 6.83693 9.43449 6.895 9.553C7.205 10.173 7.481 10.566 7.707 10.793C7.884 10.97 7.98 10.997 8 11C8.02 10.996 8.116 10.97 8.293 10.793C8.519 10.567 8.796 10.173 9.106 9.553C9.463 8.839 9.853 8.233 10.293 7.793C10.735 7.35 11.308 7 12 7C12.692 7 13.265 7.35 13.707 7.793C14.147 8.233 14.537 8.839 14.895 9.553C14.9537 9.67053 14.9887 9.79848 14.9979 9.92953C15.0072 10.0606 14.9905 10.1922 14.9489 10.3168C14.9073 10.4414 14.8416 10.5566 14.7555 10.6558C14.6694 10.755 14.5645 10.8363 14.447 10.895C14.3295 10.9537 14.2015 10.9887 14.0705 10.9979C13.9394 11.0072 13.8078 10.9905 13.6832 10.9489C13.5586 10.9073 13.4434 10.8416 13.3442 10.7555C13.245 10.6694 13.1637 10.5645 13.105 10.447H13.106ZM11.996 9H12H11.998H11.996Z",
  },
  no: {
    d: "M8.707 7.293C8.5184 7.11084 8.2658 7.01005 8.0036 7.01233C7.7414 7.0146 7.49059 7.11977 7.30518 7.30518C7.11977 7.49059 7.0146 7.7414 7.01233 8.0036C7.01005 8.2658 7.11084 8.5184 7.293 8.707L8.586 10L7.293 11.293C7.19749 11.3852 7.12131 11.4956 7.0689 11.6176C7.01649 11.7396 6.9889 11.8708 6.98775 12.0036C6.9866 12.1364 7.0119 12.2681 7.06218 12.391C7.11246 12.5139 7.18671 12.6255 7.2806 12.7194C7.3745 12.8133 7.48615 12.8875 7.60905 12.9378C7.73194 12.9881 7.86362 13.0134 7.9964 13.0123C8.12918 13.0111 8.2604 12.9835 8.3824 12.9311C8.50441 12.8787 8.61475 12.8025 8.707 12.707L10 11.414L11.293 12.707C11.4816 12.8892 11.7342 12.99 11.9964 12.9877C12.2586 12.9854 12.5094 12.8802 12.6948 12.6948C12.8802 12.5094 12.9854 12.2586 12.9877 11.9964C12.99 11.7342 12.8892 11.4816 12.707 11.293L11.414 10L12.707 8.707C12.8892 8.5184 12.99 8.2658 12.9877 8.0036C12.9854 7.7414 12.8802 7.49059 12.6948 7.30518C12.5094 7.11977 12.2586 7.0146 11.9964 7.01233C11.7342 7.01005 11.4816 7.11084 11.293 7.293L10 8.586L8.707 7.293Z",
  },
};

/**
 * Container outlines share one command structure (four line + curve pairs)
 * so the animated icon can interpolate between any two of them.
 */
const CIRCLE =
  "M10 1L10 1C14.971 1 19 5.029 19 10L19 10C19 14.971 14.971 19 10 19L10 19C5.029 19 1 14.971 1 10L1 10C1 5.029 5.029 1 10 1Z";

const containers: Record<VoteIconChoice, string> = {
  yes: CIRCLE,
  ifNeedBe:
    "M10 1L10 1C17.2 1 19 2.8 19 10L19 10C19 17.2 17.2 19 10 19L10 19C2.8 19 1 17.2 1 10L1 10C1 2.8 2.8 1 10 1Z",
  no: "M10 1L16 1C17.657 1 19 2.343 19 4L19 16C19 17.657 17.657 19 16 19L4 19C2.343 19 1 17.657 1 16L1 4C1 2.343 2.343 1 4 1Z",
};

function Glyph({ type }: { type: VoteIconType }) {
  const { d } = glyphs[type];
  return (
    <g transform="translate(10 10) scale(1.2) translate(-10 -10)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={d}
        className={type === "pending" ? "fill-current" : "fill-white"}
      />
    </g>
  );
}

function IconFrame({
  type,
  size,
  title,
  className,
  children,
}: VoteIconProps & { type: VoteIconType; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn(voteIconVariants({ size, type }), className)}
    >
      {title ? <title>{title}</title> : null}
      {/* Filled shapes read heavier than bare glyphs, so the artwork is inset
          within the box rather than filling it. */}
      <g transform="translate(10 10) scale(0.8) translate(-10 -10)">
        {children}
      </g>
    </svg>
  );
}

/** Pending is a bare dash; the other votes sit in a filled container. */
export function VoteIcon({ type = "pending", ...props }: VoteIconProps) {
  return (
    <IconFrame type={type} {...props}>
      {type === "pending" ? null : (
        <path d={containers[type]} fill="currentColor" />
      )}
      <Glyph type={type} />
    </IconFrame>
  );
}

const EASE_OUT_UI = [0.23, 1, 0.32, 1] as const;
const ORIGIN = {
  transformOrigin: "10px 10px",
  transformBox: "view-box",
} as const;

/**
 * VoteIcon that morphs its container and swaps its glyph when `type`
 * changes; leaving pending grows the container in from the centre. For controls that cycle the vote in place; static icons should
 * use VoteIcon.
 */
export function AnimatedVoteIcon({
  type = "pending",
  ...props
}: VoteIconProps) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: 0.2, ease: EASE_OUT_UI };
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, transform: "scale(0.5)" };
  const shown = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, transform: "scale(1)" };

  return (
    <IconFrame type={type} {...props}>
      <motion.path
        initial={false}
        animate={{
          d: type === "pending" ? CIRCLE : containers[type],
          ...(type === "pending" ? hidden : shown),
        }}
        transition={{
          ...transition,
          d: reduceMotion ? { duration: 0 } : transition,
        }}
        style={ORIGIN}
        fill="currentColor"
      />
      <AnimatePresence initial={false}>
        <motion.g
          key={type}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={transition}
          style={ORIGIN}
        >
          <Glyph type={type} />
        </motion.g>
      </AnimatePresence>
    </IconFrame>
  );
}
