export function OrDivider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-x-2.5">
      <hr className="grow border-gray-100" />
      <div className="text-muted-foreground lowercase">{text}</div>
      <hr className="grow border-gray-100" />
    </div>
  );
}
