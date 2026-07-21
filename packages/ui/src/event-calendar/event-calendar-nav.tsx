// Title: Event Calendar Nav
// Description: Composable navigation - Today, prev/next, period title, view switcher dropdown, and a free toolbar slot.

"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { addDays, format } from "date-fns";
import type { ReactNode } from "react";
import { useState } from "react";
import type { ButtonProps } from "../button";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";

import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import {
  useEventCalendarNavigation,
  useEventCalendarSettings,
  useEventCalendarView,
  useEventCalendarViewConfig,
} from "./event-calendar";
import { toZoned } from "./event-calendar-lib";
import type { CalendarView } from "./event-calendar-types";
import { IconPlaceholder } from "./icon-placeholder";

/** Configured nav button variant/size (viewConfig.navButtonVariant/Size)
 *  plus the shared classNames.navButton hook, merged on every nav button. */
function useNavButtonProps(): {
  variant: NonNullable<ButtonProps["variant"]>;
  size: "sm" | "default";
  iconSize: "icon-sm" | "icon";
  className: string | undefined;
} {
  const viewConfig = useEventCalendarViewConfig();
  return {
    variant: viewConfig.navButtonVariant,
    size: viewConfig.navButtonSize,
    iconSize: viewConfig.navButtonSize === "sm" ? "icon-sm" : "icon",
    className: viewConfig.classNames?.navButton,
  };
}

/** Resolved nav tooltip policy (viewConfig.navTooltips + classNames.navTooltip). */
function useNavTooltipConfig(): {
  disabled: boolean;
  side: "top" | "bottom" | "left" | "right";
  delay: number;
  closeDelay: number;
  timeout: number;
  className: string | undefined;
} {
  const viewConfig = useEventCalendarViewConfig();
  const config =
    viewConfig.navTooltips === false ? undefined : viewConfig.navTooltips;
  return {
    disabled: viewConfig.navTooltips === false,
    // the nav sits at the top of the calendar, so tooltips open upward by
    // default (away from the grid); collision flipping still drops them below
    // when there is no room above
    side: config?.side ?? "top",
    delay: config?.delay ?? 600,
    closeDelay: config?.closeDelay ?? 0,
    timeout: config?.timeout ?? 300,
    className: viewConfig.classNames?.navTooltip,
  };
}

type NavButtonProps = Omit<useRender.ComponentProps<"button">, "children"> & {
  children?: ReactNode;
  /**
   * Tooltip policy (the part that usually goes wrong on clickable elements):
   * tooltips appear ONLY on hover or keyboard focus-visible - a pointer click
   * never re-triggers them. Buttons that open overlays (the view switcher)
   * use a hover-only tooltip that is force-closed while the overlay is up and
   * ignores focus, so nothing flashes when focus returns after selection.
   * Icon-only buttons default to their accessible label; Today defaults to
   * the actual current date (info the label doesn't carry). Pass null to
   * disable one, or any node to override; viewConfig.navTooltips=false turns
   * them all off (its object form tunes side/delay/closeDelay/timeout).
   */
  tooltip?: ReactNode | null;
};

/** Hover/focus-visible tooltip wrapper; renders the bare button when disabled
 *  (per-button content=null or viewConfig.navTooltips=false). */
function NavTooltip({
  content,
  children,
}: {
  content: ReactNode | null;
  children: React.ReactElement;
}) {
  const tooltips = useNavTooltipConfig();
  if (tooltips.disabled || content === null || content === undefined)
    return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={tooltips.side} className={tooltips.className}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function EventCalendarNavToday({
  className,
  render,
  children,
  tooltip,
  ...props
}: NavButtonProps) {
  const { today, isToday } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const nav = useNavButtonProps();
  // display-zone "today", like every other today derivation in the calendar
  // (a system-zone new Date() can name a different day than Today opens)
  const defaultTooltip = format(
    toZoned(new Date(), settings.timeZone),
    settings.i18n.formats.dayTitle,
    { locale: settings.locale },
  );
  return (
    <NavTooltip content={tooltip === undefined ? defaultTooltip : tooltip}>
      <Button
        variant={nav.variant}
        size={nav.size}
        data-slot="event-calendar-nav-today"
        data-active={isToday || undefined}
        className={cn(nav.className, className)}
        onClick={today}
        render={render}
        {...props}
      >
        {children ?? settings.i18n.labels.today}
      </Button>
    </NavTooltip>
  );
}

function EventCalendarNavPrev({
  className,
  render,
  children,
  tooltip,
  ...props
}: NavButtonProps) {
  const { prev } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const nav = useNavButtonProps();
  return (
    <NavTooltip
      content={tooltip === undefined ? settings.i18n.labels.previous : tooltip}
    >
      <Button
        variant={nav.variant}
        size={nav.iconSize}
        data-slot="event-calendar-nav-prev"
        aria-label={settings.i18n.labels.previous}
        className={cn(nav.className, className)}
        onClick={prev}
        render={render}
        {...props}
      >
        {children ?? (
          <IconPlaceholder
            lucide="ChevronLeftIcon"
            tabler="IconChevronLeft"
            hugeicons="ArrowLeft01Icon"
            phosphor="CaretLeftIcon"
            remixicon="RiArrowLeftSLine"
            className="size-4"
            aria-hidden="true"
          />
        )}
      </Button>
    </NavTooltip>
  );
}

function EventCalendarNavNext({
  className,
  render,
  children,
  tooltip,
  ...props
}: NavButtonProps) {
  const { next } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const nav = useNavButtonProps();
  return (
    <NavTooltip
      content={tooltip === undefined ? settings.i18n.labels.next : tooltip}
    >
      <Button
        variant={nav.variant}
        size={nav.iconSize}
        data-slot="event-calendar-nav-next"
        aria-label={settings.i18n.labels.next}
        className={cn(nav.className, className)}
        onClick={next}
        render={render}
        {...props}
      >
        {children ?? (
          <IconPlaceholder
            lucide="ChevronRightIcon"
            tabler="IconChevronRight"
            hugeicons="ArrowRight01Icon"
            phosphor="CaretRightIcon"
            remixicon="RiArrowRightSLine"
            className="size-4"
            aria-hidden="true"
          />
        )}
      </Button>
    </NavTooltip>
  );
}

interface EventCalendarTitleProps extends useRender.ComponentProps<"div"> {
  format?: (ctx: { title: string }) => ReactNode;
}

function EventCalendarTitle({
  className,
  render,
  format: formatTitle,
  ...props
}: EventCalendarTitleProps) {
  const { title } = useEventCalendarNavigation();
  const viewConfig = useEventCalendarViewConfig();
  const defaultProps = {
    "data-slot": "event-calendar-title",
    "aria-live": "polite" as const,
    className: cn(
      "min-w-0 truncate font-semibold text-sm",
      viewConfig.classNames?.title,
      className,
    ),
    children: formatTitle?.({ title }) ?? title,
  };
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

interface EventCalendarViewSwitcherProps
  extends Omit<useRender.ComponentProps<"button">, "children"> {
  children?: ReactNode;
  /** Hover/focus-visible hint; defaults to the "Select view" label. Pass
   *  null to disable (overlay-opener policy). */
  tooltip?: ReactNode | null;
}

function EventCalendarViewSwitcher({
  className,
  render,
  children,
  tooltip,
  ...props
}: EventCalendarViewSwitcherProps) {
  const { view, dayCount, availableViews, setView } = useEventCalendarView();
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const nav = useNavButtonProps();
  const tooltips = useNavTooltipConfig();
  const labels = settings.i18n.labels;
  // Controlled open: selecting a view swaps the whole content subtree in the
  // same click, so closing must not depend on the menu's internal handler.
  const [open, setOpen] = useState(false);
  // Hover-only tooltip: when the menu closes, Base UI focuses the trigger
  // again and a focus-opened tooltip would flash - ignore focus opens.
  const [tipOpen, setTipOpen] = useState(false);

  const selectView = (v: CalendarView, opts?: { dayCount?: number }) => {
    setOpen(false);
    setView(v, opts);
  };

  const viewLabel = (v: CalendarView) =>
    v === "days"
      ? settings.i18n.viewNames.days(dayCount)
      : settings.i18n.viewNames[v];

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next: boolean) => {
        setOpen(next);
        if (next) setTipOpen(false);
      }}
    >
      {/* Tooltip on an overlay-opener: hover-only (focus opens ignored) and
          force-closed while the menu is up, so it never lingers or flashes
          when focus returns on close. Inherits the nav TooltipProvider's
          delay/closeDelay/timeout. */}
      <Tooltip
        open={tipOpen && !open}
        onOpenChange={(next: boolean, details: { reason?: string }) => {
          // opens are hover-only; the trigger-focus open that follows a
          // menu close is ignored, closes always land
          if (next && details?.reason !== "trigger-hover") return;
          setTipOpen(next);
        }}
      >
        <DropdownMenuTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  variant={nav.variant}
                  size={nav.size}
                  data-slot="event-calendar-view-switcher"
                  aria-label={labels.selectView}
                  className={cn("gap-1", nav.className, className)}
                />
              }
            />
          }
          {...props}
        >
          {children ?? (
            <>
              {viewLabel(view)}
              <IconPlaceholder
                lucide="ChevronDownIcon"
                tabler="IconChevronDown"
                hugeicons="ArrowDown01Icon"
                phosphor="CaretDownIcon"
                remixicon="RiArrowDownSLine"
                className="size-4 opacity-60"
                aria-hidden="true"
              />
            </>
          )}
        </DropdownMenuTrigger>
        {tipOpen && !open && tooltip !== null && !tooltips.disabled && (
          <TooltipContent side={tooltips.side} className={tooltips.className}>
            {tooltip ?? labels.selectView}
          </TooltipContent>
        )}
      </Tooltip>
      <DropdownMenuContent
        align="start"
        className={cn("min-w-44", viewConfig.classNames?.viewSwitcherContent)}
      >
        {/* Base UI contract: GroupLabel must live inside Menu.Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel
            className={cn(
              "font-normal text-muted-foreground",
              viewConfig.classNames?.viewSwitcherLabel,
            )}
          >
            {settings.i18n.labels.selectView}
          </DropdownMenuLabel>
          {availableViews.map((v) =>
            v === "days" ? (
              viewConfig.dayCountPresets.map((count) => (
                <DropdownMenuItem
                  key={`days-${count}`}
                  data-active={
                    (view === "days" && dayCount === count) || undefined
                  }
                  onClick={() => selectView("days", { dayCount: count })}
                >
                  {settings.i18n.viewNames.days(count)}
                  {/* hint derived from the preset itself, not i18n's default */}
                  {viewConfig.enableShortcuts && (
                    <EventCalendarViewShortcut>
                      {count}
                    </EventCalendarViewShortcut>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem
                key={v}
                data-active={view === v || undefined}
                onClick={() => selectView(v)}
              >
                {viewLabel(v)}
                {viewConfig.enableShortcuts && (
                  <EventCalendarViewShortcut>
                    {labels.viewShortcuts[v]}
                  </EventCalendarViewShortcut>
                )}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Outline key badge; theme-token only, so it adapts to every style. */
function EventCalendarViewShortcut({ children }: { children: ReactNode }) {
  const viewConfig = useEventCalendarViewConfig();
  return (
    <kbd
      data-slot="event-calendar-view-shortcut"
      className={cn(
        "ms-auto inline-flex size-5 shrink-0 items-center justify-center rounded-sm border font-sans text-muted-foreground text-xs",
        viewConfig.classNames?.viewShortcut,
      )}
    >
      {children}
    </kbd>
  );
}

interface EventCalendarDatePickerProps
  extends Omit<useRender.ComponentProps<"button">, "children"> {
  children?: ReactNode;
  /** "auto" (default) resolves per view: range for week/N-days/agenda. */
  mode?: "auto" | "single" | "range";
  /** Hover/focus-visible hint; defaults to null - no tooltip, because the
   *  button opens an overlay (see the NavButtonProps tooltip policy). */
  tooltip?: ReactNode | null;
}

/** Views whose period reads better as a highlighted range. */
const RANGE_VIEWS: CalendarView[] = ["week", "days", "agenda"];

/**
 * Optional go-to-date picker (shadcn Calendar in a popover), view-aware:
 * week/N-days/agenda highlight the whole active range (any click re-anchors
 * the period), other views select a single date. Not part of the default
 * nav - compose it yourself (or any external picker driving
 * useEventCalendarNavigation().goTo). No tooltip by default: it opens an
 * overlay (see the NavButtonProps tooltip policy); pass `tooltip` to opt in.
 */
function EventCalendarDatePicker({
  className,
  render,
  children,
  tooltip = null,
  mode,
  ...props
}: EventCalendarDatePickerProps) {
  const { date, goTo, activeRange } = useEventCalendarNavigation();
  const { view } = useEventCalendarView();
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const nav = useNavButtonProps();
  const [open, setOpen] = useState(false);
  const zoned = toZoned(date, settings.timeZone);

  const configured = mode ?? "auto";
  const resolved =
    configured === "auto"
      ? RANGE_VIEWS.includes(view)
        ? "range"
        : "single"
      : configured;

  const pick = (next: Date | undefined) => {
    if (!next) return;
    goTo(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <NavTooltip content={tooltip}>
        <PopoverTrigger
          render={
            <Button
              variant={nav.variant}
              size={nav.iconSize}
              data-slot="event-calendar-date-picker"
              data-mode={resolved}
              aria-label={settings.i18n.labels.goToDate}
              className={cn(nav.className, className)}
              render={render}
            />
          }
          {...props}
        >
          {children ?? (
            <IconPlaceholder
              lucide="CalendarIcon"
              tabler="IconCalendarEvent"
              hugeicons="Calendar04Icon"
              phosphor="CalendarBlankIcon"
              remixicon="RiCalendarLine"
              className="size-4"
              aria-hidden="true"
            />
          )}
        </PopoverTrigger>
      </NavTooltip>
      <PopoverContent
        align="start"
        className={cn("w-auto p-0!", viewConfig.classNames?.datePickerContent)}
      >
        {resolved === "range" ? (
          <Calendar
            mode="range"
            selected={{
              from: toZoned(activeRange.start, settings.timeZone),
              to: toZoned(addDays(activeRange.end, -1), settings.timeZone),
            }}
            defaultMonth={zoned}
            onDayClick={pick}
            locale={settings.locale}
            weekStartsOn={settings.weekStartsOn}
          />
        ) : (
          <Calendar
            mode="single"
            selected={zoned}
            defaultMonth={zoned}
            onSelect={pick}
            locale={settings.locale}
            weekStartsOn={settings.weekStartsOn}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

type EventCalendarToolbarProps = useRender.ComponentProps<"div">;

/** Free slot for consumer toolbar buttons; pure layout shell. */
function EventCalendarToolbar({
  className,
  render,
  ...props
}: EventCalendarToolbarProps) {
  const viewConfig = useEventCalendarViewConfig();
  const defaultProps = {
    "data-slot": "event-calendar-toolbar",
    className: cn(
      "flex items-center gap-2",
      viewConfig.classNames?.toolbar,
      className,
    ),
    children: props.children,
  };
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

interface EventCalendarNavProps extends useRender.ComponentProps<"div"> {
  /**
   * Render the view switcher in the composed layout. Turn off when the
   * calendar ships with a fixed view (e.g. a month-only embed) and users
   * should not be able to change it.
   * @default true
   */
  showViewSwitcher?: boolean;
}

/**
 * Default composed nav: Today, prev/next, title, spacer, view switcher.
 * Pass children to use it as a pure layout shell instead.
 */
function EventCalendarNav({
  className,
  render,
  children,
  showViewSwitcher = true,
  ...props
}: EventCalendarNavProps) {
  const viewConfig = useEventCalendarViewConfig();
  const tooltips = useNavTooltipConfig();
  const defaultProps = {
    "data-slot": "event-calendar-nav",
    className: cn(
      "flex min-w-0 flex-wrap items-center gap-1 px-2 py-2",
      viewConfig.stickyNav && "sticky top-0 z-30 bg-background",
      viewConfig.classNames?.nav,
      className,
    ),
    children: children ?? (
      // Shared provider: first tooltip waits, moving between buttons is instant
      <TooltipProvider
        delay={tooltips.delay}
        closeDelay={tooltips.closeDelay}
        timeout={tooltips.timeout}
      >
        <EventCalendarNavToday />
        {showViewSwitcher && <EventCalendarViewSwitcher />}
        <div className="flex items-center">
          <EventCalendarNavPrev />
          <EventCalendarNavNext />
        </div>
        {/* ms-3 sets the title apart from the tight control cluster so the
            period reads as its own group, not another button */}
        <EventCalendarTitle className="ms-3" />
        <div className="grow" />
      </TooltipProvider>
    ),
  };
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(defaultProps, props),
  });
}

export {
  EventCalendarDatePicker,
  EventCalendarNav,
  EventCalendarNavNext,
  EventCalendarNavPrev,
  EventCalendarNavToday,
  EventCalendarTitle,
  EventCalendarToolbar,
  EventCalendarViewSwitcher,
};
export type {
  EventCalendarNavProps,
  EventCalendarTitleProps,
  EventCalendarToolbarProps,
  EventCalendarViewSwitcherProps,
};
