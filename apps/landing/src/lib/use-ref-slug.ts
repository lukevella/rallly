"use client";

import { usePathname } from "next/navigation";
import { getRefSlug } from "@/lib/ref-slug";

export function useRefSlug() {
  return getRefSlug(usePathname());
}
