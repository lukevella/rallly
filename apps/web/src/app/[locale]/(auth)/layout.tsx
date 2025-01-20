import { cn } from "@rallly/ui";
import { DotPattern } from "@rallly/ui/dot-pattern";
import type { Metadata } from "next";
import { redirect, RedirectType } from "next/navigation";

import { getServerSession } from "@/auth";
import { Logo } from "@/components/logo";
import { isQuickCreateEnabled } from "@/features/quick-create";
import { QuickStartButton } from "@/features/quick-create/quick-create-button";
import { QuickStartWidget } from "@/features/quick-create/quick-create-widget";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session?.user.email) {
    return redirect("/", RedirectType.replace);
  }

  return (
    <div className="relative flex h-screen flex-col items-center justify-center bg-gray-100 p-2 lg:p-4">
      <div className="z-10 flex w-full max-w-7xl flex-1 rounded-xl border bg-white shadow-sm lg:max-h-[720px] lg:p-2">
        <div className="flex flex-1 flex-col gap-6 p-6 lg:p-16">
          <div className="p-4">
            <Logo className="mx-auto" />
          </div>
          <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-sm">{children}</div>
          </div>
          {isQuickCreateEnabled ? (
            <div className="flex justify-center lg:hidden">
              <QuickStartButton />
            </div>
          ) : null}
        </div>
        {isQuickCreateEnabled ? (
          <div className="relative hidden flex-1 flex-col justify-center rounded-lg border border-gray-100 bg-gray-50 lg:flex lg:p-16">
            <div className="z-10 mx-auto w-full max-w-md">
              <QuickStartWidget />
            </div>
            <DotPattern
              cx={10}
              cy={10}
              className={cn(
                "[mask-image:radial-gradient(400px_circle_at_top,white,transparent)]",
              )}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: {
    template: "%s - Rallly",
    default: "Rallly",
  },
};
