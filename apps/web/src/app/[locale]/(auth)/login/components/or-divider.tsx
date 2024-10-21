export function OrDivider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-x-2.5">
      <hr className="grow" />
      <div className="text-muted-foreground text-xs uppercase">{text}</div>
      <hr className="grow" />
    </div>
  );
}
