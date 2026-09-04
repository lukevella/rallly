"use client";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import Link from "next/link";
import type React from "react";
import { linkToApp } from "@/lib/linkToApp";
import { useRefSlug } from "@/lib/use-ref-slug";

export function CtaButton({
  captureEvent,
  cta,
  size = "xl",
  className,
  children,
}: {
  captureEvent: string;
  cta: string;
  size?: "default" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRefSlug();
  return (
    <Link
      href={linkToApp("/new", { ref, cta })}
      className={buttonVariants({
        size,
        variant: "primary",
        className: cn("shadow-md transition-all active:shadow-none", className),
      })}
      onClick={() => {
        // cta is also the link's cta param, so a click here and the signup it
        // leads to can be joined on one value.
        posthog.capture(captureEvent, { cta, ref });
      }}
    >
      {children}
    </Link>
  );
}
