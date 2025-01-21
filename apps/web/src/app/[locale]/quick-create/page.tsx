import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { LogInIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuickStartWidget } from "@/features/quick-create/quick-create-widget";
import { isSelfHosted } from "@/utils/constants";

export default async function QuickCreatePage() {
  if (isSelfHosted) {
    // self hosted users should not see this page
    notFound();
  }
  return (
    <div className="flex min-h-screen p-2">
      <div className="flex flex-1 flex-col gap-6 rounded-xl border bg-white p-6">
        <div className="mx-auto w-full max-w-md flex-1">
          <div className="space-y-8">
            <div className="flex-1">
              <QuickStartWidget />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Button className="rounded-full" asChild>
            <Link href="/login" className="flex items-center gap-2">
              <Icon>
                <LogInIcon />
              </Icon>
              Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
