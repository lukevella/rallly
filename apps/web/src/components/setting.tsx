"use client";

import { cva } from "class-variance-authority";
import { InfoIcon } from "lucide-react";
import React from "react";
import { PageIcon } from "@/components/page-icons";

const SettingContext = React.createContext<{
  titleId: string;
  descriptionId: string;
  hintId: string;
  /** Whether SettingControl labels its child, or the control names itself. */
  labelsControl: boolean;
} | null>(null);

const useSetting = () => {
  const context = React.useContext(SettingContext);
  if (!context) {
    throw new Error("Setting components must be used within <Setting>");
  }
  return context;
};

export const SettingsGroup = ({ children }: React.PropsWithChildren) => {
  return <div className="divide-y">{children}</div>;
};

const settingVariants = cva(
  // The icon column is `auto`, so it collapses to zero width without a
  // SettingIcon; a uniform `gap-x` would still indent iconless rows, so the
  // gap is zero and SettingIcon/SettingControl carry their own margins.
  // Below `sm` everything stacks in one column so wide controls (pickers,
  // input groups) get the full width rather than being squeezed beside the
  // title; from `sm` up the control moves to its own column on the right.
  "grid grid-cols-1 py-4 [column-gap:0] [grid-template-areas:'title'_'description'_'control'_'hint'] first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:[grid-template-areas:'icon_title_control'_'icon_description_control'_'icon_hint_hint']",
  {
    variants: {
      interactive: {
        true: "cursor-pointer select-none",
        false: "",
      },
    },
    defaultVariants: { interactive: false },
  },
);

const SettingProvider = ({
  children,
  labelsControl,
}: React.PropsWithChildren<{ labelsControl: boolean }>) => {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const hintId = React.useId();
  const value = React.useMemo(
    () => ({ titleId, descriptionId, hintId, labelsControl }),
    [titleId, descriptionId, hintId, labelsControl],
  );
  return (
    <SettingContext.Provider value={value}>{children}</SettingContext.Provider>
  );
};

/**
 * A setting whose control is a single labelable element — a switch, a select.
 * The row renders as a label, so clicking anywhere on it activates the
 * control, and SettingControl labels the control automatically.
 *
 * For a control made of several elements (an input with a button, a picker, a
 * dialog trigger) use SettingRow instead: there is no single element for a
 * label to point at, and wrapping several controls in one label is invalid.
 */
export const Setting = ({ children }: React.PropsWithChildren) => {
  return (
    <SettingProvider labelsControl>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: control is rendered inside */}
      <label className={settingVariants({ interactive: true })}>
        {children}
      </label>
    </SettingProvider>
  );
};

/**
 * A setting whose control is not a single labelable element — a button, an
 * input with its own actions, a picker. Renders a plain row, so the control has
 * to name itself: spread `useSettingLabels()` onto whichever element is the
 * real control.
 */
export const SettingRow = ({ children }: React.PropsWithChildren) => {
  return (
    <SettingProvider labelsControl={false}>
      <div className={settingVariants()}>{children}</div>
    </SettingProvider>
  );
};

export const SettingIcon = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="mr-3 hidden self-start [grid-area:icon] sm:block">
      <PageIcon size="lg">{children}</PageIcon>
    </div>
  );
};

export const SettingTitle = ({
  children,
  id,
}: React.PropsWithChildren<{ id?: string }>) => {
  const { titleId } = useSetting();
  return (
    <div
      id={id ?? titleId}
      className="flex items-center gap-x-2 text-sm [grid-area:title]"
    >
      {children}
    </div>
  );
};

export const SettingDescription = ({
  children,
  id,
}: React.PropsWithChildren<{ id?: string }>) => {
  const { descriptionId } = useSetting();
  return (
    <div
      id={id ?? descriptionId}
      className="mt-0.5 text-muted-foreground text-xs [grid-area:description]"
    >
      {children}
    </div>
  );
};

/**
 * Holds the row's control. Inside `Setting` the control is a single labelable
 * element, so the row's title and description are applied to it directly.
 * Inside `SettingRow` there is no single element to label — the control names
 * itself with `useSettingLabels()` — so the child is rendered untouched.
 *
 * Inside `Setting` the child must be created in client code: cloneElement
 * corrupts elements streamed from server components (dev SSR bails out with
 * "Element type is invalid"). Server-composed controls go in `SettingRow`.
 */
export const SettingControl = ({
  children,
}: {
  children: React.ReactElement<{
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }>;
}) => {
  const { titleId, descriptionId, hintId, labelsControl } = useSetting();
  return (
    <div className="mt-3 self-start justify-self-start [grid-area:control] sm:mt-0 sm:ml-3 sm:justify-self-end">
      {/* A dangling hint id is ignored by assistive tech while no hint is rendered */}
      {labelsControl
        ? React.cloneElement(children, {
            "aria-labelledby": titleId,
            "aria-describedby": `${descriptionId} ${hintId}`,
          })
        : children}
    </div>
  );
};

export const useSettingLabels = () => {
  const { titleId, descriptionId, hintId } = useSetting();
  return {
    "aria-labelledby": titleId,
    "aria-describedby": `${descriptionId} ${hintId}`,
  };
};

/**
 * Supplementary content spanning the full row width, below the title and
 * control. Text hints get an info icon; `plain` drops the icon and the text
 * styling for rich content such as an embedded preview.
 */
export const SettingHint = ({
  children,
  plain = false,
}: React.PropsWithChildren<{ plain?: boolean }>) => {
  const { hintId } = useSetting();

  if (plain) {
    return (
      <div id={hintId} className="mt-4 [grid-area:hint]">
        {children}
      </div>
    );
  }

  return (
    <div
      id={hintId}
      className="mt-4 flex items-start gap-x-1.5 text-muted-foreground text-xs [grid-area:hint]"
    >
      <InfoIcon className="size-3.5 shrink-0 translate-y-px" />
      <span>{children}</span>
    </div>
  );
};
