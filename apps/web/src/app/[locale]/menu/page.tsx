import Image from "next/image";
import Link from "next/link";

import { MainSidebar } from "@/app/[locale]/(admin)/main-navigation";
import { BackButton } from "@/app/[locale]/menu/back-button";

export default function Page() {
  return (
    <div className="bg-gray-100">
      <div className="flex h-12 items-center px-4">
        <BackButton />
      </div>
      <div className="px-5 py-5">
        <MainSidebar />
      </div>
    </div>
  );
}
