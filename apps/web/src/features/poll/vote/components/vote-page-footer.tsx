import { InstanceFooterLinks } from "@/components/instance-footer-links";

/**
 * The instance's footer links, which carry legal disclosures and are shown
 * regardless of the space's settings. Attribution and the theme switcher
 * live in the card's sidebar footer instead.
 */
export function VotePageFooter({
  footerLinks,
}: {
  footerLinks: { label: string; href: string }[];
}) {
  if (footerLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 py-3 text-center text-muted-foreground text-sm">
      <InstanceFooterLinks links={footerLinks} />
    </div>
  );
}
