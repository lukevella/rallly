"use client";

import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { CalendarSearchIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { OptimizedAvatarImage } from "../optimized-avatar-image";

// Root component
export interface PollItemProps {
  pollId: string;
  className?: string;
  children: ReactNode;
}

export function PollItem({ pollId, className, children }: PollItemProps) {
  return (
    <div
      className={cn(
        "hover:bg-muted/50 relative rounded-md border transition-colors",
        className,
      )}
    >
      <Link href={`/poll/${pollId}`} className="absolute inset-0" />
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-3">
        {children}
      </div>
    </div>
  );
}

// Icon component
export interface PollItemIconProps {
  fromDate: Date;
  toDate: Date;
  className?: string;
}

export function PollItemIcon({
  fromDate,
  toDate,
  className,
}: PollItemIconProps) {
  return (
    <div className="flex-shrink-0">
      <DateRangeIcon
        fromDate={fromDate}
        toDate={toDate}
        className={className}
      />
    </div>
  );
}

// Content container
export interface PollItemContentProps {
  className?: string;
  children: ReactNode;
}

export function PollItemContent({ className, children }: PollItemContentProps) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}

// Title component
export interface PollItemTitleProps {
  className?: string;
  children: ReactNode;
}

export function PollItemTitle({ className, children }: PollItemTitleProps) {
  return (
    <div
      className={cn("truncate text-base font-medium tracking-tight", className)}
    >
      {children}
    </div>
  );
}

// Details component
export interface PollItemDetailsProps {
  className?: string;
  children: ReactNode;
}

export function PollItemDetails({ className, children }: PollItemDetailsProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Location component
export interface PollItemLocationProps {
  location: string;
  className?: string;
}

export function PollItemLocation({
  location,
  className,
}: PollItemLocationProps) {
  if (!location) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Icon>
        <MapPinIcon />
      </Icon>
      <span className="truncate">{location}</span>
    </div>
  );
}

// Date range component
export interface PollItemDateRangeProps {
  from: Date;
  to: Date;
  optionsCount?: number;
  className?: string;
}

export function PollItemDateRange({
  from,
  to,
  optionsCount,
  className,
}: PollItemDateRangeProps) {
  const fromFormatted = dayjs(from).format("MMM D");
  const toFormatted = dayjs(to).format("MMM D");

  // Generate a condensed description of the options
  const getOptionsDescription = () => {
    // Base date range text
    const dateRange =
      fromFormatted === toFormatted
        ? fromFormatted
        : `${fromFormatted} - ${toFormatted}`;

    // If no options count or just 1 option, show only the date range
    if (!optionsCount || optionsCount <= 1) {
      return dateRange;
    }

    // For multiple options, show a condensed format with option count
    return `${dateRange} • ${optionsCount} options`;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Icon>
        <CalendarSearchIcon />
      </Icon>
      <span>{getOptionsDescription()}</span>
    </div>
  );
}

// Participants component
export interface PollItemParticipantsProps {
  participants: number;
  participantsList: {
    id: string;
    name: string;
    user: {
      image: string | null;
    } | null;
  }[];
  className?: string;
}

export function PollItemParticipants({
  participants,
  participantsList,
  className,
}: PollItemParticipantsProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {participantsList.slice(0, 5).map((participant) => (
          <div key={participant.id} className="relative">
            <OptimizedAvatarImage
              src={participant.user?.image ?? undefined}
              name={participant.name}
              size="sm"
              className="border-background border-2"
            />
          </div>
        ))}
      </div>
      {participants > 5 && (
        <div className="text-muted-foreground ml-1 text-xs">
          +{participants - 5}
        </div>
      )}
    </div>
  );
}

// Helper components for the date icons
interface DateIconProps {
  date: Date;
  className?: string;
  isStacked?: boolean;
}

function DateIcon({ date, className = "", isStacked = false }: DateIconProps) {
  const month = dayjs(date).format("MMM");
  const day = dayjs(date).format("D");

  return (
    <div
      className={cn(
        "bg-background flex size-10 flex-col items-center justify-center rounded-lg border",
        className,
      )}
    >
      <div
        className={cn(
          "text-muted-foreground flex items-center justify-center text-xs",
          {
            "opacity-90": isStacked,
          },
        )}
      >
        {month}
      </div>
      <div
        className={cn(
          "flex items-center justify-center rounded-md text-sm font-medium",
          {
            "opacity-90": isStacked,
          },
        )}
      >
        {day}
      </div>
    </div>
  );
}

interface DateRangeIconProps {
  fromDate: Date;
  toDate: Date;
  className?: string;
}

function DateRangeIcon({
  fromDate,
  toDate,
  className = "",
}: DateRangeIconProps) {
  return (
    <div className={cn("relative isolate", className)}>
      {/* Back date (second date) */}
      <div className="relative z-20">
        <DateIcon date={toDate} isStacked={true} />
      </div>
      {/* Front date (first date) */}
      <div className="absolute -bottom-1 z-10">
        <DateIcon date={fromDate} />
      </div>
    </div>
  );
}
