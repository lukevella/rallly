import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { LogInIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  isQuickCreateEnabled,
  QuickCreateWidget,
} from "@/features/quick-create";
import { getTranslation } from "@/i18n/server";

export default async function QuickCreatePage() {
  if (!isQuickCreateEnabled) {
    notFound();
  }

  const { t } = await getTranslation();
  return (
    <div className="flex h-dvh p-2">
      <div className="flex flex-1 flex-col gap-6 rounded-xl border bg-white p-6">
        <div className="mx-auto w-full max-w-md flex-1">
          <div className="space-y-8">
            <div className="flex-1">
              <QuickCreateWidget />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Button className="rounded-full" asChild>
            <Link href="/login" className="flex items-center gap-2">
              <Icon>
                <LogInIcon />
              </Icon>
              {t("login")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("quickCreate"),
  };
}
