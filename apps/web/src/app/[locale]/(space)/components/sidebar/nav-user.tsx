"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";

export function NavUser({
  name,
  image,
  plan,
}: {
  name: string;
  image?: string;
  plan?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link
      href="/settings/profile"
      data-state={pathname.startsWith("/settings") ? "active" : "inactive"}
      className="group relative flex w-full items-center gap-3 rounded-md p-3 text-sm hover:bg-gray-200 data-[state=active]:bg-gray-200"
    >
      <OptimizedAvatarImage size="md" src={image} name={name} />
      <div className="flex-1 truncate text-left">
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground mt-0.5 truncate font-normal">
          {plan}
        </div>
      </div>
    </Link>
  );
}
