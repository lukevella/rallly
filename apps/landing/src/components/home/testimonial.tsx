import type * as React from "react";
import { FadeIn } from "@/components/home/fade-in";

export function Testimonial({
  logo,
  avatar,
  name,
  title,
  children,
}: {
  logo: React.ReactNode;
  avatar: React.ReactNode;
  name: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <FadeIn
      amount="all"
      className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-16"
    >
      <p className="max-w-2xl text-lg leading-normal sm:text-2xl">{children}</p>
      <div className="flex shrink-0 flex-col gap-y-4 sm:items-end sm:text-right">
        {logo}
        <div className="flex items-center gap-x-3 sm:flex-col-reverse sm:items-end sm:gap-y-4">
          {avatar}
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-gray-600 text-sm">{title}</div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
