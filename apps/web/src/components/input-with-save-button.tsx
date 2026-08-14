"use client";

import { cn } from "@rallly/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rallly/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CheckIcon } from "lucide-react";
import type React from "react";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Text input with an inline save button that appears when there are unsaved
 * changes. Must be rendered inside a form: the save button submits it.
 */
export function InputWithSaveButton({
  isDirty,
  isSaving,
  disabled,
  className,
  ...inputProps
}: React.ComponentProps<typeof InputGroupInput> & {
  isDirty: boolean;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const showSaveButton = isDirty && !disabled;

  return (
    <InputGroup className={cn("w-56", className)}>
      <InputGroupInput {...inputProps} disabled={disabled} />
      {/* Kept mounted so the input width doesn't change when the save button
          appears; `invisible` also keeps it out of the tab order. It must not
          be disabled instead — that would trip InputGroup's `has-disabled:`
          styles and grey out the whole field. */}
      <InputGroupAddon
        align="inline-end"
        className={cn(!showSaveButton && "invisible")}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <InputGroupButton
                type="submit"
                size="icon-xs"
                loading={isSaving}
                aria-label={t("save", { defaultValue: "Save" })}
              >
                <CheckIcon />
              </InputGroupButton>
            }
          />
          <TooltipContent>
            <Trans i18nKey="save" defaults="Save" />
          </TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  );
}
