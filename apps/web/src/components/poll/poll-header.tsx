import { Button } from "@rallly/ui/button";
import Image from "next/image";
import Link from "next/link";

import { UserDropdown } from "@/components/user-dropdown";

import { useUser } from "../user-provider";

export function PollHeader() {
  const { user } = useUser();
  return (
    <div className="sticky top-0 z-40 border-b bg-gray-100/90 p-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-x-2.5">
          <Link
            className="transition-transform active:translate-y-1"
            href="https://rallly.co"
          >
            <Image
              src="/images/logo-mark.svg"
              alt="Rallly"
              width={32}
              height={32}
              priority={true}
              className="shrink-0"
            />
            <span className="sr-only">Rallly</span>
          </Link>
        </div>
        <div className="flex items-center gap-x-2.5">
          {user.email ? (
            <UserDropdown />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
