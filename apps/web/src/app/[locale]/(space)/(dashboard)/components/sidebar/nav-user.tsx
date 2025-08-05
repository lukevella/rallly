"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { isSpacesEnabled } from "@/features/space/constants";

export function NavUser({
  name,
  image,
  plan,
  email,
}: {
  name: string;
  image?: string;
  plan?: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  return (
    <Link
      href="/account/profile"
      data-state={pathname.startsWith("/account") ? "active" : "inactive"}
      className="group relative flex w-full items-center gap-3 rounded-md p-3 text-sm hover:bg-gray-200 data-[state=active]:bg-gray-200"
    >
      <OptimizedAvatarImage size="lg" src={image} name={name} />
      <div className="flex-1 truncate text-left">
        <div className="font-medium">{name}</div>
        <div className="mt-0.5 truncate font-normal text-muted-foreground text-xs">
          {isSpacesEnabled ? email : plan}
        </div>
      </div>
    </Link>
  );
}
