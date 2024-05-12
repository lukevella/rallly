"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        router.back();
      }}
    >
      <XIcon className="text-muted-foreground size-4" />
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
