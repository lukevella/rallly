import { SidebarTrigger } from "@rallly/ui/sidebar";

export function FullWidthLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function FullWidthLayoutHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 rounded-t-lg border-b bg-background/90 px-3 py-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </header>
  );
}

export function FullWidthLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="p-3 pb-44 md:px-6 md:pt-6">{children}</main>;
}

export function FullWidthLayoutTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <h1 className="font-bold text-xl">{children}</h1>
    </div>
  );
}
