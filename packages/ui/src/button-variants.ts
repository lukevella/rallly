import { cva } from "class-variance-authority";

import { cn } from "./lib/utils";

export const buttonVariants = cva(
  cn(
    "group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-normal outline-none transition-opacity transition-transform focus-visible:ring-2 focus-visible:ring-ring active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-90",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground ring-1 ring-button-outline ring-inset hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground ring-1 ring-button-outline ring-inset hover:bg-destructive/90",
        default:
          "bg-transparent ring-1 ring-button-outline ring-inset hover:bg-accent",
        ghost:
          "border-transparent bg-transparent text-foreground ring-1 ring-transparent ring-inset hover:bg-accent data-[state=open]:bg-accent",
        actionBar:
          "border-transparent bg-action-bar text-action-bar-foreground hover:bg-action-bar-foreground/10 data-[state=open]:bg-action-bar-foreground/20",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] px-2 text-sm text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-2.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-12 gap-2 px-3 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
