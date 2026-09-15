import { Suspense } from "react";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { loadOptionalActiveSpace } from "@/features/space/loaders";
import { AdminPageLoader } from "./admin-page-loader";

// Keeps the route shell synchronous so it can flush before the reads
// resolve. The page below is client-only, so this is the one server
// boundary they can be loaded from.
async function AdminPageWithFooterLinks() {
  const [footerLinks, activeSpace] = await Promise.all([
    loadFooterLinks(),
    loadOptionalActiveSpace(),
  ]);

  // The attribution action updates the active space, and only its admins
  // may; the page checks the poll belongs to that space before showing it.
  const manageableSpace =
    activeSpace?.role === "admin"
      ? { id: activeSpace.id, name: activeSpace.name }
      : null;

  return (
    <AdminPageLoader
      footerLinks={footerLinks}
      manageableSpace={manageableSpace}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <AdminPageWithFooterLinks />
    </Suspense>
  );
}
