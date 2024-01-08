import { Button } from "@rallly/ui/button";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";

import { PageTitle } from "@/app/components/page-layout";
import { getTranslation } from "@/app/i18n";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
} from "@/components/page-dialog";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale);
  return (
    <PageDialog icon={LogOutIcon}>
      <PageDialogHeader>
        <PageTitle>{t("logout")}</PageTitle>
        <PageDialogDescription>
          {t("logoutDescription", {
            defaultValue: "Are you sure you want to logout?",
          })}
        </PageDialogDescription>
      </PageDialogHeader>
      <PageDialogFooter>
        <form action="/auth/logout" method="POST">
          <Button variant="destructive" type="submit">
            {t("logout")}
          </Button>
        </form>
        <Button variant="ghost" asChild>
          <Link href="/">{t("cancel")}</Link>
        </Button>
      </PageDialogFooter>
    </PageDialog>
  );
}

export const generateMetadata = async ({
  params,
}: {
  params: { locale: string };
}) => {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("logout"),
  };
};
