import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ZapIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "@/i18n/client";

export function QuickCreateButton() {
  return (
    <Button className="rounded-full" asChild>
      <Link href="/quick-create">
        <Icon>
          <ZapIcon className="size-4" />
        </Icon>
        <Trans i18nKey="quickCreate" defaults="Quick Create" />
      </Link>
    </Button>
  );
}
