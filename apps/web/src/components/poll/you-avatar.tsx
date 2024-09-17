import { useTranslation } from "@/app/i18n/client";

export function YouAvatar() {
  const { t } = useTranslation();

  return (
    <div className="inline-flex size-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
      {t("you")[0]}
    </div>
  );
}
