import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import type * as React from "react";
import { LinkBase } from "@/i18n/client/link";

export function HeroAnnouncement({
  href,
  badge,
  children,
}: {
  href: string;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <LinkBase
      href={href}
      prefetch={false}
      className="group -ml-1 inline-flex max-w-full items-center gap-x-2 rounded-full bg-gray-200/50 p-1 pr-3 text-sm transition-colors hover:bg-gray-200"
    >
      <Badge variant="primary" className="shrink-0 rounded-full">
        {badge}
      </Badge>
      <span className="min-w-0 truncate">{children}</span>
      <ArrowRightIcon
        className="size-3 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
        aria-hidden="true"
      />
    </LinkBase>
  );
}

export function Hero({
  title,
  description,
  announcement,
  children,
  className,
  centered = false,
  wideDescription = false,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  announcement?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  centered?: boolean;
  wideDescription?: boolean;
}) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <h1
        className={cn(
          "max-w-[700px] text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-[2.75rem]/none",
          centered && "mx-auto",
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "mt-4 text-pretty font-normal text-base/6 text-gray-500 sm:text-lg sm:leading-relaxed",
          wideDescription ? "max-w-[760px]" : "max-w-[620px]",
          centered && "mx-auto",
        )}
      >
        {description}
      </p>
      {announcement ? <div className="mt-8">{announcement}</div> : null}
      {children ? <div className="mt-6 sm:mt-16">{children}</div> : null}
    </div>
  );
}
