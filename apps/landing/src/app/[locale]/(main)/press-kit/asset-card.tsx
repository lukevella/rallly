import { cn } from "@rallly/ui";
import type * as React from "react";

export function AssetCard({
  name,
  preview,
  previewClassName,
  links,
  dark,
}: {
  name: string;
  preview: React.ReactNode;
  previewClassName?: string;
  links: { label: string; href: string }[];
  dark?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className={cn(
          "flex items-center justify-center",
          dark ? "bg-gray-900" : "bg-white",
          previewClassName ?? "h-32",
        )}
      >
        {preview}
      </div>
      <div className="flex items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3">
        <div className="text-gray-800 text-sm">{name}</div>
        <div className="flex gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              download
              aria-label={`${name} (${link.label})`}
              className="font-medium text-primary text-sm hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
