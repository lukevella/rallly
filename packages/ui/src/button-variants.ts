import { cva } from "class-variance-authority";

import { cn } from "./lib/utils";

export const buttonVariants = cva(
  cn(
    "group inline-flex shrink-0 items-center justify-center whitespace-nowrap font-normal tracking-tight transition-[background-color,color,transform] ease-out [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-90",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground ring-1 ring-button-outline ring-inset hover:bg-primary-hover not-aria-[haspopup]:active:scale-[.98] active:bg-primary-active motion-reduce:active:scale-100",
        destructive:
          "bg-destructive text-destructive-foreground ring-1 ring-button-outline ring-inset hover:bg-destructive-hover not-aria-[haspopup]:active:scale-[.98] active:bg-destructive-active motion-reduce:active:scale-100",
        default:
          "bg-background/80 ring-1 ring-button-outline ring-inset backdrop-blur-lg hover:bg-accent not-aria-[haspopup]:active:scale-[.98] active:bg-accent data-popup-open:bg-accent motion-reduce:active:scale-100 dark:bg-foreground/5",
        ghost:
          "border-transparent bg-transparent text-foreground ring-1 ring-transparent ring-inset hover:bg-accent not-aria-[haspopup]:active:scale-[.98] active:bg-accent data-popup-open:bg-accent motion-reduce:active:scale-100 [&>svg]:opacity-75",
        actionBar:
          "border-transparent bg-action-bar text-action-bar-foreground hover:bg-action-bar-foreground/10 not-aria-[haspopup]:active:scale-[.98] active:bg-action-bar-foreground/20 data-popup-open:bg-action-bar-foreground/20 motion-reduce:active:scale-100",
        link: "border-transparent text-primary underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-1.75 has-data-[icon=inline-start]:pl-1.75 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-12 gap-2 px-5.5 text-base has-data-[icon=inline-end]:pr-3.75 has-data-[icon=inline-start]:pl-3.75 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
      shape: {
        pill: "rounded-full",
        rounded: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  },
);
