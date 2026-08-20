"use client";

import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { MenuIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { CtaButton } from "@/components/home/cta-button";
import { LinkBase } from "@/i18n/client/link";
import { linkToApp } from "@/lib/linkToApp";

const PANEL_ID = "mobile-menu-panel";

export const MobileMenu = ({
  links,
  menuLabel,
  closeLabel,
  loginLabel,
  ctaLabel,
}: {
  links: { href: string; label: string }[];
  menuLabel: string;
  closeLabel: string;
  loginLabel: string;
  ctaLabel: string;
}) => {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: dismiss the menu whenever navigation happens
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        aria-label={open ? closeLabel : menuLabel}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="relative block size-4">
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out",
              open
                ? "rotate-90 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100",
            )}
          >
            <MenuIcon className="size-4 text-muted-foreground" />
          </span>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out",
              open
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-50 opacity-0",
            )}
          >
            <XIcon className="size-4 text-muted-foreground" />
          </span>
        </span>
      </Button>
      <div
        id={PANEL_ID}
        hidden={!open}
        className="absolute inset-x-0 top-full z-10 flex h-[calc(100dvh-100%)] flex-col bg-gray-100 lg:hidden"
      >
        <nav className="flex grow flex-col gap-1 overflow-y-auto px-4 py-8 sm:px-6">
          {links.map((link) => (
            <LinkBase
              key={link.href}
              href={link.href}
              className="-mx-2 block rounded-lg px-2 py-3 font-normal text-3xl text-foreground tracking-tight hover:bg-gray-200 hover:no-underline"
            >
              {link.label}
            </LinkBase>
          ))}
        </nav>
        <div className="flex flex-col gap-3 border-t px-4 py-6 sm:px-6">
          <LinkBase
            href={linkToApp("/login")}
            className={buttonVariants({
              variant: "default",
              size: "lg",
              className: "w-full",
            })}
          >
            {loginLabel}
          </LinkBase>
          <CtaButton
            size="lg"
            className="w-full"
            captureEvent="landing:mobile_menu_cta_click"
          >
            {ctaLabel}
          </CtaButton>
        </div>
      </div>
    </>
  );
};
