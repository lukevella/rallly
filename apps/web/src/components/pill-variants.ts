import { cva } from "class-variance-authority";

export const pillVariants = cva(
  "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-control px-3.5 text-sm ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      selected: {
        true: "bg-white text-foreground ring-button-outline dark:bg-foreground/5",
        false:
          "text-muted-foreground ring-transparent hover:bg-gray-50 dark:hover:bg-foreground/10",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);
