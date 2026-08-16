"use client";
import { posthog } from "@rallly/posthog/client";
import * as m from "motion/react-m";
import type React from "react";

export function FadeIn({
  children,
  className,
  delay = 0,
  amount,
  captureOnEnter,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  amount?: "some" | "all";
  captureOnEnter?: string;
}) {
  return (
    <m.div
      transition={{ delay, duration: 1, type: "spring", bounce: 0.3 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      onViewportEnter={
        captureOnEnter ? () => posthog.capture(captureOnEnter) : undefined
      }
      className={className}
    >
      {children}
    </m.div>
  );
}
