import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled("pollAdmin")) {
    notFound();
  }
  return children;
}
