"use client";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import Link from "next/link";
import type React from "react";
import { linkToApp } from "@/lib/linkToApp";

export function CtaButton({
  captureEvent,
  size = "xl",
  className,
  children,
}: {
  captureEvent: string;
  size?: "default" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={linkToApp("/new")}
      className={buttonVariants({
        size,
        variant: "primary",
        className: cn("shadow-md transition-all active:shadow-none", className),
      })}
      onClick={() => {
        posthog.capture(captureEvent);
      }}
    >
      {children}
    </Link>
  );
}
