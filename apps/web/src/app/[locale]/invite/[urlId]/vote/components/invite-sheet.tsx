"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@rallly/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { XIcon } from "lucide-react";
import { ballotBarButtonClassName } from "@/features/poll/invite/components/ballot-pill";
import { useTranslation } from "@/i18n/client";

/**
 * An icon button in the site header and the sheet it opens, over the page so
 * answers the viewer has not saved stay put.
 */
export function InviteSheet({
  label,
  icon,
  title,
  className,
  bar = false,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  /** On the sheet, to set its width. */
  className?: string;
  /** A labelled button beside the ballot's actions instead of an icon. */
  bar?: boolean;
  children: React.ReactNode;
}) {
  const dialog = useDialog();

  return (
    <>
      {bar ? (
        <Button
          type="button"
          className={ballotBarButtonClassName}
          {...dialog.triggerProps}
        >
          {icon}
          {label}
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={label}
                {...dialog.triggerProps}
              />
            }
          >
            {icon}
          </TooltipTrigger>
          <TooltipContent className="text-xs">{label}</TooltipContent>
        </Tooltip>
      )}
      <Sheet {...dialog.dialogProps}>
        <InviteSheetPanel title={title} className={className}>
          {children}
        </InviteSheetPanel>
      </Sheet>
    </>
  );
}

/** The sheet's panel: a titled header with a close button over its content. */
function InviteSheetPanel({
  title,
  className,
  children,
}: {
  title: React.ReactNode;
  /** To set its width. */
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const closeLabel = t("close", { defaultValue: "Close" });

  return (
    <SheetContent
      showCloseButton={false}
      className={cn("flex flex-col gap-0 overflow-hidden p-0", className)}
    >
      <SheetHeader className="h-14 shrink-0 flex-row items-center justify-between gap-2 space-y-0 border-b py-0 pr-2.5 pl-4 text-left">
        <SheetTitle className="min-w-0 truncate tracking-tight">
          {title}
        </SheetTitle>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={closeLabel}
              className="shrink-0 rounded-full"
            />
          }
        >
          <XIcon />
        </SheetClose>
      </SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </SheetContent>
  );
}
