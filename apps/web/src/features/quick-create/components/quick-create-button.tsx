import { buttonVariants } from "@rallly/ui";
import { ZapIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";

export async function QuickCreateButton() {
  const { t, i18n } = await getTranslation();
  return (
    <Link
      href="/quick-create"
      className={buttonVariants({ className: "rounded-full" })}
    >
      <ZapIcon className="size-4 text-muted-foreground" />
      <Trans
        t={t}
        i18n={i18n}
        ns="app"
        i18nKey="quickCreate"
        defaults="Quick Create"
      />
    </Link>
  );
}
