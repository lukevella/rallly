import { InfoIcon } from "lucide-react";

import { Breadcrumbs } from "@/app/[locale]/(admin)/breadcrumbs";

export function AdminHeader() {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
    </div>
  );
}

function Hint({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex">
      <div className="flex grow flex-col gap-x-4 gap-y-1 rounded-md border border-gray-600/10 bg-gray-100 px-3 py-2 lg:flex-row lg:items-center">
        <div className="flex items-center gap-x-2 text-xs font-semibold text-gray-600">
          <InfoIcon className="size-4 text-gray-600/75" />
          Guest User
        </div>
        <div className="grow text-sm text-gray-600/90">{children}</div>
      </div>
    </div>
  );
}

function GuestUserAlert() {
  return <Hint>You are using a temporary guest session.</Hint>;
}
