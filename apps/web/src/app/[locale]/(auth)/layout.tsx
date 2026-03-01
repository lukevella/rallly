import {
  isQuickCreateEnabled,
  QuickCreateButton,
  QuickCreateWidget,
} from "@/features/quick-create";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
      <div className="z-10 flex w-full flex-1 lg:p-4">
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="my-auto">
            <div className="mx-auto w-full max-w-sm">{children}</div>
          </div>
          {isQuickCreateEnabled ? (
            <div className="flex justify-center lg:hidden">
              <QuickCreateButton />
            </div>
          ) : null}
        </div>
        {isQuickCreateEnabled ? (
          <div className="relative hidden flex-1 flex-col justify-center rounded-lg border bg-muted/50 lg:flex lg:p-16">
            <div className="z-10 mx-auto w-full max-w-md">
              <QuickCreateWidget />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
