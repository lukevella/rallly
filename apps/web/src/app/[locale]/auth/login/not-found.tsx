import { Button } from "@rallly/ui/button";
import { XCircleIcon } from "lucide-react";
import Link from "next/link";

import { getTranslation } from "@/app/i18n";
import {
  PageDialog,
  PageDialogDescription,
  PageDialogFooter,
  PageDialogHeader,
  PageDialogTitle,
} from "@/components/page-dialog";

export default async function NotFound() {
  // TODO (Luke Vella) [2023-10-31]: No way to get locale from not-found
  // See: https://github.com/vercel/next.js/discussions/43179
  const { t } = await getTranslation("en");
  return (
    <PageDialog icon={XCircleIcon}>
      <PageDialogHeader>
        <PageDialogTitle>{t("authErrorTitle")}</PageDialogTitle>
        <PageDialogDescription>
          {t("authErrorDescription")}
        </PageDialogDescription>
      </PageDialogHeader>
      <PageDialogFooter>
        <Button asChild variant="primary">
          <Link href="/login">{t("authErrorCta")}</Link>
        </Button>
      </PageDialogFooter>
    </PageDialog>
  );
}
