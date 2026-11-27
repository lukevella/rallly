"use client";

import { cn } from "@rallly/ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@rallly/ui/breadcrumb";
import { ArrowLeftIcon } from "lucide-react";
import React from "react";
import { Link } from "@/components/link";
import { Trans } from "@/i18n/client";

/**
 * Polls › poll title. The title and the poll's status join the trail once the
 * page has scrolled past its heading, so the bar always says where you are.
 */
export function PollBreadcrumb({
  title,
  status,
}: {
  title?: string;
  status?: React.ReactNode;
}) {
  const scrolled = useScrolledPast();

  const fade = cn(
    "transition-opacity duration-150 motion-reduce:transition-none",
    scrolled ? "opacity-100" : "pointer-events-none opacity-0",
  );

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink
            className="flex items-center gap-x-1.5"
            render={<Link href="/polls" />}
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            <Trans i18nKey="polls" defaults="Polls" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        {title ? (
          <>
            <BreadcrumbSeparator className={cn("shrink-0", fade)} />
            <BreadcrumbItem className={cn("min-w-0 gap-3", fade)}>
              <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
              {status}
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** How far the page scrolls before the sticky bar shows the poll's details. */
const REVEAL_OFFSET = 120;

/** Whether the page has scrolled past the point the sticky bar fills in. */
export function useScrolledPast() {
  const [scrolledPast, setScrolledPast] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      // A full load briefly holds hidden copies of streamed content.
      const scroller = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="page-scroll"]'),
      ).find((element) => !element.closest("[hidden]"));
      setScrolledPast((scroller?.scrollTop ?? 0) > REVEAL_OFFSET);
    };
    check();
    // Capture catches the inner scroll area, whose scroll events don't bubble.
    document.addEventListener("scroll", check, {
      capture: true,
      passive: true,
    });
    return () =>
      document.removeEventListener("scroll", check, { capture: true });
  }, []);

  return scrolledPast;
}
