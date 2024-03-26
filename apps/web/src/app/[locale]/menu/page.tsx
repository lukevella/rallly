import Image from "next/image";
import Link from "next/link";

import { MainSidebar } from "@/app/[locale]/(admin)/main-navigation";
import { BackButton } from "@/app/[locale]/menu/back-button";

export default function Page() {
  return (
    <div className="bg-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          className="inline-block transition-transform active:translate-y-1"
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
      <div className="px-5 py-5">
        <MainSidebar />
      </div>
    </div>
  );
}
