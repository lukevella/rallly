"use client";

import { InfoIcon } from "lucide-react";
import React from "react";
import { PageIcon } from "@/components/page-icons";

const SettingContext = React.createContext<{
  titleId: string;
  descriptionId: string;
  hintId: string;
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

export const Setting = ({ children }: React.PropsWithChildren) => {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const hintId = React.useId();
  const value = React.useMemo(
    () => ({ titleId, descriptionId, hintId }),
    [titleId, descriptionId, hintId],
  );

  return (
    <SettingContext.Provider value={value}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: control is rendered inside */}
      <label className="grid cursor-pointer select-none grid-cols-[1fr_auto] gap-x-3 py-4 [grid-template-areas:'title_control'_'description_control'_'hint_hint'] first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:[grid-template-areas:'icon_title_control'_'icon_description_control'_'icon_hint_hint']">
        {children}
      </label>
    </SettingContext.Provider>
  );
};

export const SettingIcon = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="hidden self-start [grid-area:icon] sm:block">
      <PageIcon size="lg">{children}</PageIcon>
    </div>
  );
};

export const SettingTitle = ({ children }: React.PropsWithChildren) => {
  const { titleId } = useSetting();
  return (
    <div
      id={titleId}
      className="flex items-center gap-x-2 text-sm [grid-area:title]"
    >
      {children}
    </div>
  );
};

export const SettingDescription = ({ children }: React.PropsWithChildren) => {
  const { descriptionId } = useSetting();
  return (
    <div
      id={descriptionId}
      className="mt-0.5 text-muted-foreground text-xs [grid-area:description]"
    >
      {children}
    </div>
  );
};

export const SettingControl = ({
  children,
}: {
  children: React.ReactElement<{
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
  }>;
}) => {
  const { titleId, descriptionId, hintId } = useSetting();
  return (
    <div className="self-start justify-self-end [grid-area:control]">
      {/* A dangling hint id is ignored by assistive tech while no hint is rendered */}
      {React.cloneElement(children, {
        "aria-labelledby": titleId,
        "aria-describedby": `${descriptionId} ${hintId}`,
      })}
    </div>
  );
};

export const SettingHint = ({ children }: React.PropsWithChildren) => {
  const { hintId } = useSetting();
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
