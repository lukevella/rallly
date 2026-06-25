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
    <div className="page-bg-gray-100">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl px-6 pt-10 pb-16 sm:pb-24 lg:px-8"
      >
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
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <p className="font-semibold text-base/8 text-primary">{label}</p>
          <h1 className="mt-4 text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-pretty text-muted-foreground text-xl">
            {description}
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-lg">
          <ul className="grid">{children}</ul>
          <div className="mt-16 flex items-center justify-center gap-x-4">
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
    <li className="relative flex gap-x-6 rounded-xl p-4 hover:bg-accent">
      <div className="flex size-12 flex-none items-center justify-center self-center rounded-lg border border-border bg-card shadow-xs">
        {icon}
      </div>
      <div className="flex-auto">
        <h3 className="font-semibold text-foreground text-sm">
          <Link href={href}>
            <span aria-hidden="true" className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <p className="mt-0.5 text-muted-foreground text-sm/6">{description}</p>
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
