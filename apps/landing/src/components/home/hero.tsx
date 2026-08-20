import { Badge } from "@rallly/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

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
    <Link
      href={href}
      prefetch={false}
      className="group -ml-1 inline-flex items-center gap-x-2 rounded-full bg-gray-200/50 p-1 pr-3 text-sm transition-all hover:bg-gray-200"
    >
      <Badge variant="primary" className="rounded-full">
        {badge}
      </Badge>
      <span className="flex items-center gap-x-1">{children}</span>
      <ArrowRightIcon
        className="size-3 text-gray-500 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

export function Hero({
  title,
  description,
  announcement,
  children,
  className,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  announcement?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-prose text-balance font-normal text-base/6 text-gray-500 sm:text-lg sm:leading-relaxed [.text-center_&]:mx-auto">
        {description}
      </p>
      {announcement ? <div className="mt-8">{announcement}</div> : null}
      {children ? <div className="mt-6 sm:mt-16">{children}</div> : null}
    </div>
  );
}
