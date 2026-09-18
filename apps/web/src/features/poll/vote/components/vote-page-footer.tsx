import { InstanceFooterLinks } from "@/components/instance-footer-links";
import { PoweredByLink } from "@/features/poll/vote/components/powered-by-link";

/**
 * Attribution and the instance's footer links. They are independent:
 * attribution can be hidden per instance or per space, while the links
 * carry legal disclosures and are shown regardless.
 */
export function VotePageFooter({
  pollId,
  spaceId,
  hideAttribution,
  footerLinks,
}: {
  pollId: string;
  spaceId: string | null;
  hideAttribution: boolean;
  footerLinks: { label: string; href: string }[];
}) {
  if (hideAttribution && footerLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 py-3 text-center text-muted-foreground text-sm">
      <InstanceFooterLinks links={footerLinks} />
      {hideAttribution ? null : (
        <PoweredByLink pollId={pollId} spaceId={spaceId} />
      )}
    </div>
  );
}
