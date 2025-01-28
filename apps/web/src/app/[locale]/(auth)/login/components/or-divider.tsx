import { getTranslation } from "@/i18n/server";

export async function OrDivider() {
  const { t } = await getTranslation();
  return (
    <div className="flex items-center gap-x-2.5">
      <hr className="grow border-gray-100" />
      <div className="text-muted-foreground lowercase">{t("or")}</div>
      <hr className="grow border-gray-100" />
    </div>
  );
}
