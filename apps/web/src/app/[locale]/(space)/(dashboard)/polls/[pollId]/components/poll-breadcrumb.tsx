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
 * Polls › poll title. The title joins the trail once the page heading
 * (`headingId`) has scrolled out of view, so the bar always says where you are,
 * along with the poll's status.
 */
export function PollBreadcrumb({
  title,
  status,
  headingId,
}: {
  title?: string;
  status?: React.ReactNode;
  headingId?: string;
}) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const heading = headingId ? document.getElementById(headingId) : null;
    if (!heading) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setScrolled(!entry.isIntersecting);
      }
    });
    observer.observe(heading);
    return () => observer.disconnect();
  }, [headingId]);

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
