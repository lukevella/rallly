"use client";

import { Trans } from "@/components/trans";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeInstanceLicense } from "../mutations";

export function RemoveLicenseButton({
  licenseId,
}: {
  licenseId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          await removeInstanceLicense({
            licenseId,
          });
          router.refresh();
        })
      }
    >
      <Icon>
        <XIcon />
      </Icon>
      <Trans i18nKey="removeLicense" defaults="Remove License" />
    </Button>
  );
}
