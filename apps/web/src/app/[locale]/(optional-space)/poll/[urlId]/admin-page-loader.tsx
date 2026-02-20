"use client";
import dynamic from "next/dynamic";

const AdminPage = dynamic(
  () => import("./admin-page").then((mod) => mod.AdminPage),
  { ssr: false },
);

export function AdminPageLoader() {
  return <AdminPage />;
}
