function DescriptionList({ children }: { children: React.ReactNode }) {
  return <dl>{children}</dl>;
}

function DescriptionListTitle({ children }: { children: React.ReactNode }) {
  return <dt className="mb-1 text-muted-foreground text-xs">{children}</dt>;
}

function DescriptionListValue({ children }: { children: React.ReactNode }) {
  return <dd className="mb-4 font-mono text-sm last:mb-0">{children}</dd>;
}

export { DescriptionList, DescriptionListTitle, DescriptionListValue };
