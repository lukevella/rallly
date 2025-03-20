export function TopBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background/90 sticky top-0 z-10 flex items-center gap-4 rounded-t-lg border-b p-3 backdrop-blur-md">
      {children}
    </div>
  );
}

export function TopBarLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center gap-x-4">{children}</div>;
}

export function TopBarRight({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-end gap-x-4">
      {children}
    </div>
  );
}

export function TopBarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-x-2">{children}</div>;
}
