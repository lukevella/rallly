import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { AdminPageLoader } from "./admin-page-loader";

export default async function Page() {
  const footerLinks = await loadFooterLinks();

  return <AdminPageLoader footerLinks={footerLinks} />;
}
