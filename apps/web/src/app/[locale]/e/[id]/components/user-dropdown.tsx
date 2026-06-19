"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { LogOutIcon, Settings2Icon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function UserDropdown({
  name,
  email,
  image,
  className,
}: {
  name: string;
  email: string;
  image?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className={cn("group min-w-0", className)}>
        <Button variant="ghost" className="rounded-full" size="icon">
          <OptimizedAvatarImage src={image} name={name} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <OptimizedAvatarImage src={image} name={name} size="md" />
          <div className="grow">
            <div className="font-medium text-foreground text-sm">{name}</div>
            {email ? (
              <div className="font-normal text-muted-foreground text-xs">
                {email}
              </div>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex items-center gap-x-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <Trans i18nKey="profile" defaults="Profile" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/settings/preferences"
            className="flex items-center gap-x-2"
          >
            <Settings2Icon className="size-4 text-muted-foreground" />
            <Trans i18nKey="preferences" defaults="Preferences" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-x-2"
          onClick={async () => {
            await signOut();
            router.refresh();
          }}
        >
          <LogOutIcon className="size-4 text-muted-foreground" />
          <Trans i18nKey="logout" defaults="Logout" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
