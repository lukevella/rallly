"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export const LinkBase = ({
  href,
  children,
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const { i18n } = useTranslation();
  const newHref = href.startsWith("/")
    ? `/${i18n.resolvedLanguage}${href}`
    : href;
  return (
    <Link className={className} href={newHref}>
      {children}
    </Link>
  );
};
