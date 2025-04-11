"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { ProBadge } from "@/components/pro-badge";

export function NavUser({
  name,
  email,
  image,
  pro,
}: {
  name: string;
  email: string;
  image?: string;
  pro?: boolean;
}) {
  const pathname = usePathname();
  return (
    <Link
      href="/settings/profile"
      data-state={pathname.startsWith("/settings") ? "active" : "inactive"}
      className="flex w-full items-center gap-3 rounded-md p-3 text-sm hover:bg-gray-200 data-[state=active]:bg-gray-200"
    >
      <OptimizedAvatarImage size="md" src={image} name={name} />
      <div className="flex-1 truncate text-left">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground mt-0.5 truncate text-xs font-normal">
          {email}
        </div>
      </div>
      {pro ? <ProBadge /> : null}
    </Link>
  );
}
