"use client";
import { Button } from "@rallly/ui/button";
import { XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";

export default function Page() {
  const router = useRouter();
  return (
    <div className="fixed bg-gray-100 overflow-auto inset-0">
      <div className="sticky top-0 flex justify-between px-4 py-3">
        <div>
          <Link
            className="active:translate-y-1 transition-transform inline-block"
            href="/"
          >
            <Image
              src="/logo-mark.svg"
              alt="Rallly"
              width={32}
              height={32}
              className="shrink-0"
            />
          </Link>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            router.back();
          }}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-6 py-5">
        <Sidebar />
      </div>
    </div>
  );
}
