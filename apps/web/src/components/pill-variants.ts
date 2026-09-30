import { cva } from "class-variance-authority";

export const pillVariants = cva(
  "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      selected: {
        true: "bg-white text-sidebar-accent-foreground ring-button-outline dark:bg-muted",
        false:
          "text-muted-foreground ring-transparent hover:bg-white dark:hover:bg-muted",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);
