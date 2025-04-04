"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ArrowLeftIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Trans } from "@/components/trans";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        router.back();
      }}
    >
      <ArrowLeftIcon className="text-muted-foreground size-4" />
      <span className="hidden sm:block">
        <Trans i18nKey="back" defaults="Back" />
      </span>
    </Button>
  );
}

export function MobileMenuButton({ open }: { open?: boolean }) {
  if (open) {
    return <BackButton />;
  }

  return (
    <Button asChild variant="ghost">
      <Link prefetch={true} href="/menu">
        <Icon>
          <MenuIcon />
        </Icon>
      </Link>
    </Button>
  );
}
