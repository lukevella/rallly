"use client";
import { ProfileLayout } from "@/components/layouts/profile-layout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileLayout>{children}</ProfileLayout>;
}
