import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { PollsPage } from "./polls-page";

export default function Page() {
  return <PollsPage />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}
