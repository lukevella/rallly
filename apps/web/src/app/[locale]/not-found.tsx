import { Button } from "@rallly/ui/button";
import { FileSearchIcon } from "lucide-react";
import Link from "next/link";

import { getTranslation } from "@/app/i18n";

export default async function Page() {
  // TODO (Luke Vella) [2023-11-03]: not-found doesn't have access to params right now
  // See: https://github.com/vercel/next.js/discussions/43179
  const { t } = await getTranslation("en");

  return (
    <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <FileSearchIcon className="mb-4 inline-block h-24 w-24 text-gray-400" />
          <div className="text-primary-600 mb-2 text-3xl font-bold ">
            {t("errors_notFoundTitle")}
          </div>
          <p className="text-gray-600">{t("errors_notFoundDescription")}</p>
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
