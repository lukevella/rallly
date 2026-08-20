import { Suspense } from "react";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { AdminPageLoader } from "./admin-page-loader";

// Keeps the route shell synchronous so it can flush before the footer links
// read resolves. The page below is client-only, so this is the one server
// boundary the links can be loaded from.
async function AdminPageWithFooterLinks() {
  const footerLinks = await loadFooterLinks();

  return <AdminPageLoader footerLinks={footerLinks} />;
}

export default function Page() {
  return (
    <Suspense>
      <AdminPageWithFooterLinks />
    </Suspense>
  );
}
