import { Trans } from "@/i18n/client";

export function OrDivider() {
  return (
    <div className="flex items-center gap-x-2.5">
      <hr className="grow border-gray-100 dark:border-gray-700" />
      <div className="text-muted-foreground lowercase">
        <Trans i18nKey="or" defaults="Or" />
      </div>
      <hr className="grow border-gray-100 dark:border-gray-700" />
    </div>
  );
}
