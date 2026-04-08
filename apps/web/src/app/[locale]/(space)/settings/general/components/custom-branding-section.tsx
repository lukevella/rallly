"use client";

import { Field, FieldDescription, FieldLabel } from "@rallly/ui/field";
import { SparklesIcon } from "lucide-react";
import { ProBadge } from "@/components/pro-badge";
import { useSpace } from "@/features/space/client";
import { Trans } from "@/i18n/client";
import { CustomBrandingSwitch } from "./custom-branding-switch";

export function CustomBrandingSection() {
  const { data: space } = useSpace();

  return (
    <div className="relative space-y-2 overflow-hidden rounded-2xl border border-card-border bg-gray-50 p-4 dark:bg-gray-800">
      <SparklesIcon className="absolute -top-4 right-30 size-20 text-gray-200/50 dark:text-gray-700/50" />
      <div className="space-y-1">
        <Field orientation="horizontal">
          <FieldLabel className="relative z-10 font-medium text-base">
            <Trans
              i18nKey="useCustomBranding"
              defaults="Enable Custom Branding"
            />
          </FieldLabel>
          <ProBadge />
          <CustomBrandingSwitch checked={space.showBranding} />
        </Field>
        <FieldDescription className="relative z-10">
          <Trans
            i18nKey="showBrandingDescription"
            defaults="Use your brand identity on your public pages"
          />
        </FieldDescription>
      </div>
    </div>
  );
}
