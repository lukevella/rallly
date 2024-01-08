import Image from "next/image";
import Link from "next/link";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { BackButton } from "@/app/[locale]/menu/back-button";

export default function Page() {
  return (
    <div className="fixed bg-gray-100 overflow-auto inset-0">
      <div className="bg-gray-100 flex items-center justify-between px-4 py-3">
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
        <BackButton />
      </div>
      <div className="px-6 -mx-1 py-5">
        <Sidebar />
      </div>
    </div>
  );
}
