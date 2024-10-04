import { cn } from "@rallly/ui";
import { cva, VariantProps } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

const variants = cva(
  "inline-flex items-start w-48 justify-between gap-2 rounded-lg p-3 text-sm font-medium",
  {
    variants: {
      variant: {
        purple:
          "bg-purple-50 text-purple-600 hover:bg-purple-100 active:bg-purple-200",
        indigo:
          "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200",
        pink: "bg-pink-50 text-pink-600 hover:bg-pink-100 active:bg-pink-200",
        violet:
          "bg-violet-50 text-violet-600 hover:bg-violet-100 active:bg-violet-200",
      },
    },
    defaultVariants: {
      variant: "indigo",
    },
  },
);

export function CreateButton({
  href,
  icon,
  label,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  variant?: VariantProps<typeof variants>["variant"];
}) {
  return (
    <Link href={href} className={cn(variants({ variant }))}>
      <span className="flex flex-col gap-4">
        {icon}
        {label}
      </span>
      <span>
        <PlusIcon className="size-5" />
      </span>
    </Link>
  );
}
