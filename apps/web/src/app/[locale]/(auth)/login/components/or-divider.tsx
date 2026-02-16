"use client";
import { useTranslation } from "@/i18n/client";

export async function OrDivider() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-x-2.5">
      <hr className="grow border-gray-100 dark:border-gray-700" />
      <div className="text-muted-foreground lowercase">{t("or")}</div>
      <hr className="grow border-gray-100 dark:border-gray-700" />
    </div>
  );
}
