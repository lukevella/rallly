"use client";
import dynamic from "next/dynamic";
import { PollBrandingFromContext } from "@/components/poll/poll-branding";

const AdminPage = dynamic(
  () => import("./admin-page").then((mod) => mod.AdminPage),
  { ssr: false },
);

export function AdminPageLoader() {
  return (
    <>
      <PollBrandingFromContext />
      <AdminPage />
    </>
  );
}
