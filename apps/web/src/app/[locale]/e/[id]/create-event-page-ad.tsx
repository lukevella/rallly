import { ArrowRightIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "@/i18n/client";

export function CreateEventPageAd() {
  return (
    <Link
      href="/new?utm_source=event_page&utm_medium=ad"
      className="group relative block overflow-hidden rounded-2xl border border-primary/25 bg-card transition"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex items-center gap-3 p-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground ring-1 ring-primary/30 ring-inset">
          <CalendarIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-foreground text-sm">
              <Trans
                i18nKey="createEventPageAdTitle"
                defaults="Create your own event page"
              />
            </p>
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              <Trans i18nKey="ad" defaults="Ad" />
            </span>
          </div>
          <p className="mt-0.5 text-muted-foreground text-xs leading-snug">
            <Trans
              i18nKey="createEventPageAdSubtitle"
              defaults="Schedule meetings and share event details with Rallly. Free to start."
            />
          </p>
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}
