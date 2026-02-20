import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { DashboardHome } from "./dashboard-home";

export default function Page() {
  return <DashboardHome />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
