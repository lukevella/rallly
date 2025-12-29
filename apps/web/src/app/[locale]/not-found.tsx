import { Button } from "@rallly/ui/button";
import { FileSearchIcon } from "lucide-react";
import Link from "next/link";

import { getTranslation } from "@/i18n/server";

export default async function Page() {
  // TODO (Luke Vella) [2023-11-03]: not-found doesn't have access to params right now
  // See: https://github.com/vercel/next.js/discussions/43179
  const { t } = await getTranslation("en");

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <FileSearchIcon className="mb-4 inline-block size-24 text-muted-foreground" />
          <div className="mb-2 font-bold text-3xl text-foreground">
            {t("errors_notFoundTitle")}
          </div>
          <p className="text-muted-foreground">
            {t("errors_notFoundDescription")}
          </p>
        </div>
        <div className="flex justify-center space-x-3">
          <Button variant="primary" asChild>
            <Link href="/">{t("errors_goToHome")}</Link>
          </Button>
          <Button asChild>
            <Link
              href="https://support.rallly.co"
              passHref={true}
              className="btn-default"
            >
              {t("common_support")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
