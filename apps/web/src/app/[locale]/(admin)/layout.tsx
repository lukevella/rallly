"use client";
import { StandardLayout } from "@/components/layouts/standard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StandardLayout>{children}</StandardLayout>;
}
