import type { LucideIcon } from "lucide-react";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  RepeatIcon,
} from "lucide-react";
import type * as React from "react";

const ICONS: Record<string, LucideIcon> = {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  RepeatIcon,
};

/**
 * Lucide-only replacement for ReUI's multi-library IconPlaceholder. Renders the
 * lucide icon named by `lucide`; the other library props are accepted and
 * ignored so vendored call sites compile unchanged.
 */
export function IconPlaceholder({
  lucide,
  tabler: _tabler,
  hugeicons: _hugeicons,
  phosphor: _phosphor,
  remixicon: _remixicon,
  ...props
}: {
  lucide: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
} & React.ComponentProps<LucideIcon>) {
  const Icon = ICONS[lucide];
  if (!Icon) return null;
  return <Icon {...props} />;
}
