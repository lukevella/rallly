import { cn } from "@rallly/ui";
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
      className="group inline text-pretty text-sm/6"
    >
      <span
        className="mr-2.5 inline-block size-2 rounded-full bg-primary align-[1px]"
        aria-hidden="true"
      />
      <span className="sr-only">{badge} </span>
      <span className="text-gray-500 transition-colors group-hover:text-gray-800">
        {children}
      </span>
      <ArrowRightIcon
        className="ml-1.5 inline size-3.5 align-[-2px] text-gray-400 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
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
  descriptionClassName,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  announcement?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  centered?: boolean;
  wideDescription?: boolean;
  descriptionClassName?: string;
}) {
  return (
    <div className={cn(centered && "text-center", className)}>
      {announcement ? (
        <div
          className={cn(
            "mb-6 flex",
            centered ? "justify-center" : "justify-start",
          )}
        >
          {announcement}
        </div>
      ) : null}
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
          descriptionClassName,
        )}
      >
        {description}
      </p>
      {children ? <div className="mt-6 sm:mt-16">{children}</div> : null}
    </div>
  );
}
