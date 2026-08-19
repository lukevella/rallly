import type * as React from "react";
import { FadeIn } from "@/components/home/fade-in";

export function Mention({
  logo,
  delay = 0,
  children,
}: React.PropsWithChildren<{
  logo: React.ReactNode;
  delay?: number;
}>) {
  return (
    <FadeIn delay={delay} className="flex flex-col space-y-4 rounded-md">
      <div className="flex items-start justify-between">{logo}</div>
      <p className="grow text-base">{children}</p>
    </FadeIn>
  );
}

export function Mentions({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-8 md:grid-cols-4">{children}</div>;
}
