import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ZapIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";

export async function QuickCreateButton() {
  const { t } = await getTranslation();
  return (
    <Button className="rounded-full" asChild>
      <Link href="/quick-create">
        <Icon>
          <ZapIcon className="size-4" />
        </Icon>
        <Trans t={t} ns="app" i18nKey="quickCreate" defaults="Quick Create" />
      </Link>
    </Button>
  );
}
