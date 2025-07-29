"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Trans } from "@/components/trans";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        router.back();
      }}
      variant="ghost"
    >
      <Icon>
        <ArrowLeftIcon />
      </Icon>
      <Trans i18nKey="back" defaults="Back" />
    </Button>
  );
}
