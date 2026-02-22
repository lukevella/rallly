"use client";

import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ErrorPage({
  label,
  title,
  description,
  children,
  actions,
}: {
  label: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="bg-background">
      <main className="mx-auto w-full max-w-7xl px-6 pt-10 pb-16 sm:pb-24 lg:px-8">
        <Image
          src="/static/logo.svg"
          alt="Rallly"
          width={130}
          height={30}
          className="mx-auto dark:hidden"
        />
        <Image
          src="/static/logo-dark.svg"
          alt="Rallly"
          width={130}
          height={30}
          className="mx-auto hidden dark:block"
        />
        <div className="mx-auto mt-20 max-w-2xl text-center sm:mt-24">
          <p className="font-semibold text-base/8 text-primary">{label}</p>
          <h1 className="mt-4 text-balance font-semibold text-5xl text-foreground tracking-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl/8">
            {description}
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-lg sm:mt-20">
          <ul className="-mt-6 divide-y divide-border border-border border-b">
            {children}
          </ul>
          <div className="mt-10 flex items-center justify-center gap-x-4">
            {actions}
          </div>
        </div>
      </main>
    </div>
  );
}

export function ErrorPageLinkItem({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-x-6 py-6">
      <div className="flex size-10 flex-none items-center justify-center rounded-lg border border-border bg-card">
        {icon}
      </div>
      <div className="flex-auto">
        <h3 className="font-semibold text-foreground text-sm">
          <Link href={href}>
            <span aria-hidden="true" className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-muted-foreground text-sm/6">{description}</p>
      </div>
      <div className="flex-none self-center">
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </div>
    </li>
  );
}
