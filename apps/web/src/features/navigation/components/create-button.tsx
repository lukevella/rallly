"use client";

import { buttonVariants, cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { PlusIcon } from "lucide-react";
import { Link } from "@/components/link";
import { Trans, useTranslation } from "@/i18n/client";

// The app-wide create action, styled like SearchButton beside it in the
// sidebar. Polls are the only type today; this becomes a menu trigger once
// there is a choice.
export function CreateButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href="/new"
            aria-label={t("create", { defaultValue: "Create" })}
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: cn("rounded-full", className),
            })}
          />
        }
      >
        <PlusIcon />
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="create" defaults="Create" />
      </TooltipContent>
    </Tooltip>
  );
}
