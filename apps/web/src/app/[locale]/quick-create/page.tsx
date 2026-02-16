import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { LogInIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isQuickCreateEnabled,
  QuickCreateWidget,
} from "@/features/quick-create";
import { getTranslation } from "@/i18n/server";

export default async function QuickCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isQuickCreateEnabled) {
    notFound();
  }

  const { t } = await getTranslation(locale);
  return (
    <div className="flex h-dvh p-2">
      <Card className="flex flex-1 flex-col gap-6 p-6">
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
      </Card>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslation(locale);
  return {
    title: t("quickCreate"),
  };
}
