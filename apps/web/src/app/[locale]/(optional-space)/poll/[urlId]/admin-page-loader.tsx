"use client";
import dynamic from "next/dynamic";
import { PollBrandingFromContext } from "@/features/poll/components/poll-branding";

const AdminPage = dynamic(
  () => import("./admin-page").then((mod) => mod.AdminPage),
  { ssr: false },
);

export function AdminPageLoader({
  footerLinks,
  manageableSpace,
}: {
  footerLinks: { label: string; href: string }[];
  manageableSpace: { id: string; name: string } | null;
}) {
  return (
    <>
      <PollBrandingFromContext />
      <AdminPage footerLinks={footerLinks} manageableSpace={manageableSpace} />
    </>
  );
}
