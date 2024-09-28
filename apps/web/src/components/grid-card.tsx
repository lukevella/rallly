export function GridCardFooter({ children }: React.PropsWithChildren) {
  return <div className="relative z-10 mt-6">{children}</div>;
}

export function GridCardHeader({ children }: React.PropsWithChildren) {
  return <div className="mb-4 flex items-center gap-2">{children}</div>;
}

export const GridCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative rounded-xl border bg-white p-4">{children}</div>
  );
};
