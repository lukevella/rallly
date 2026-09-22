import { SidebarMenuBadge } from "@rallly/ui/sidebar";
import { ShieldAlertIcon } from "lucide-react";
import { getTranslation } from "@/i18n/server";
import { loadUpdateStatus } from "../loaders";

// Sidebar annotation on the control panel link. The caller gates on the
// admin role; this only decides what to show.
export async function UpdateIndicator() {
  const update = await loadUpdateStatus();

  if (!update) {
    return null;
  }

  const hasUpdate = update.status === "update-available" || !!update.newMajor;

  if (!hasUpdate) {
    return null;
  }

  const security =
    (update.status === "update-available" && update.security) ||
    update.newMajor?.security === true;

  const { t } = await getTranslation();

  return (
    <SidebarMenuBadge>
      {security ? (
        <ShieldAlertIcon className="size-4 text-destructive" />
      ) : (
        <span className="size-2 rounded-full bg-primary" />
      )}
      <span className="sr-only">
        {security
          ? t("securityUpdateAvailable", {
              defaultValue: "Security update available",
            })
          : t("updateAvailable", { defaultValue: "Update available" })}
      </span>
    </SidebarMenuBadge>
  );
}
